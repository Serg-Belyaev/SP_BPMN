//*********PREREQUISITES ***********//

//1. The application aspx-file, using this script, MUST be placed in SitePages folder, located as root in a web. Example: https://portal/site/web/SitePages/app.aspx
//2. Source-files MUST be placed in Sources filder. Example: https://portal/site/web/Sources/
//3. Sharepoint lists and libraries internal names MUST be setted correctly in the vars below.
//4. Sharepoint lists and libraries field schemas MUST meet the requirements below.

//Sharepoint site structure:
var processListName = "ProcessesList"; //the internal name of sharepoint list for all processes. The list schema must meet the following hardcoded criterias:
//Required fields (internal names mentioned, case sensitive):
//- Parent - lookup to the processes list
//- ProcessGoal - single line text/ Not requried
//- ProcessType - choice field (Process / Group)
//- Schema_to_be - lookup to bpmn-schemas library (concerned as analityc "to be""). 
//- Schema_as_is - lookup to bpmn-schemas library  (concerned as analityc "as is""). 
//- Schema_to_be_d - lookup to bpmn-schemas library (concerned as descriptive "to be"").
//- Schema_to_be_e - lookup to bpmn-schemas library (concerned as executable "to be""). 
//- Schema_as_is_d - lookup to bpmn-schemas library (concerned as descriptive "to be"").
//- Schema_as_is_e - lookup to bpmn-schemas library (concerned as executable "as is"").
//- DescriptionWiki - lookup to wikiLibName with description page.

var schemasListName = "BPMN"; //the internal name of sharepoint library for BPMN 2.0 files. 
//Required fields:
//Status - single-line text
var discussionsListName = "Disc"; //the internal name of sharepoint discussion board for hosting comments. The list schema must meet the following hardcoded criterias:
//Discussion list must be standard Sharepoint discussion board with:
// - content types: discussions, messages.
// - flat view must be represented by Flat.aspx page
//The discussion content type must have additional fields:
// - element_id - single line text. Hosts element id from BPMN-schema.
// - process_id - single line text. Hosts process id from Process list.
var wikiLibName = "Wiki";//the internal name of sharepoint wiki-library with process descriptions pages
//no special requirements

//*********END OF PREREQUISITES ***********//

//Other global vars:

var bpmnViewer; //BPMN-Viewer object. Get value from drawSchema();
var overlays; //BPMN-object for overlays
var comments = []; //array of comment. Get value from getComments();
var commentedElements = ""; //string of bpmn-elements id, which are already commented by users
var mutedTypes = [ //array of bpmn-element types. Comment lines below to prohibit users to comment the special bpmn-elements
//comment and uncomment lines below as you wish
  "bpmn:Process",
  "bpmn:Collaboration",
  "bpmn:Participant",
  //"bpmn:Lane",
  "bpmn:DataOutputAssociation",
  "bpmn:DataInputAssociation",
  "bpmn:SequenceFlow",
  "bpmn:MessageFlow",
  "bpmn:Association",
  //"bpmn:Task",
  //"bpmn:ServiceTask",
  //"bpmn:SubProcess",
  //"bpmn:DataObjectReference",
  //"bpmn:DataStoreReference",
  //"bpmn:ExclusiveGateway",
  //"bpmn:EventBasedGateway",
  //"bpmn:ParallelGateway",
  //"bpmn:TextAnnotation",
  //"bpmn:StartEvent",
  //"bpmn:EndEvent"
  //"bpmn:IntermediateCatchEvent",
  //"bpmn:BoundaryEvent",
];

//vars for properties extending BPMN 2.0:
var bpmnProperties = {
    url: "url", //name of the property in bpmn-xml for url.
    processId: "process_id" //name of the property in bpmn-xml for process_id. Process_id is using to link to another process from the processListName list
}

//Note:
//var elementRegistry = viewer.get('elementRegistry'); //get all elements: business and graph
//var startEventShape = elementRegistry.get('StartEvent_1');

var picturesFileExtensions = [".jpg", ".jpeg", ".bmp", ".gif", ".png"];   

var process = { //object for current displaying process
    id: null, //process ID in Sharepoint process list
    processOwsRow: null, //XML of the process data (response from web-service)
    descriptionWiki: null,
    schemas: { //host object for schemas ids. Id from SP-lib
        to_be_descriptive_id:0,
        to_be_analytic_id:0,
        to_be_executable_id:0,
        as_is_descriptive_id:0,
        as_is_analytic_id:0,
        as_is_executable_id:0
    }
}

var processesStructure = []; //TODO: how to manage the display order?
var processPicUrl ="../scripts/images/process.gif"; //
var groupPicUrl = "/_layouts/15/images/folder.gif?rev=23"; //invariant for all Sharepoint sites
var serviceURL;// Lists.asmx web-service url like "http://portal/site/web/_vti_bin/Lists.asmx"; 
var appUrl;//the url of web application
var flatViewUrl;// = "../Lists/Disc/Flat.aspx";//

var schema = { //host object for current schema parameters
    id: null, //file ID in SP Lib
    Url: null, //url of BPMN 2.0 file for displaying schema. Get value from getDiagramUrl();
    OwsRow: null, //XML-response from SP-web-service corresponding to displaying schema file.  Get value from getDiagramUrl();
    DescriptionUrl: null, //full path to sharepoint wiki page with description. Not ready yet
    Status: null //displaying schema status
}

var tracePerf = false; //switch on/off preformance tracking

//Not ready yet
var cacheListName = "Cache"; //listname of cache. MUST contain plain-text field "Cache"
var cache_TTL_days = 10; //Time to live for cache recorded data (in days)
var loadedFromCache = false;
var UID = "123";


//START HERE

$( document ).ready(function() {
    if (tracePerf) var startTime = Date.now();
    //Fixing attachEvent error in IE11 and SharePoint 2013:
      if (typeof browseris !== 'undefined') {
        browseris.ie = false;
      }
      
      //SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function() {
      //Sharepoint JSCOM is using for correct ititalizing global paths via SP.ClientContext (see initiateGlobalPaths func),
      //but waiting js-scipts is increasing general loading by ~500 ms
        initiateGlobalPaths();
        prepareHtmlBefore();
        prepareProcessesTree();
        drawSchema();   
        prepareHtmlAfter();
      if (tracePerf) tracePerformance("document.ready - function", Date.now()-startTime, "");
      //});  
    
});


function prepareProcessesTree() {
    if (tracePerf) var startTime = Date.now();
    var wrongParam = getParameterByName("ID"); //Исправление параметра ID на IDdoc. ID был впредыдущей версии, но конфликтовал со скриптами Шарика на aspx страницы. Для страницы html не актуально.
    if (wrongParam) window.open(appUrl +"?IDdoc="+wrongParam, "_self");
    process.id = getParameterByName("IDdoc"); 

    processesStructure = getProcessesStructure();
    // if (!loadedFromCache) saveCashe(UID);
    buildProcessesTree();
    prepareSearchBox();

    function getProcessesStructure() {
        if (tracePerf) var startTime = Date.now();
        var result = "";
        // var useCacheFromUrl = getParameterByName("useCache");
        // var useCache = !(useCacheFromUrl=="false");
        // if (useCache) result = loadFromCache(UID);
        // if (result) {
        //     loadedFromCache = true;
        //     return result;
        // }
        var queryString = 
            "<Where>"+
                "<Gt><FieldRef Name='ID' /><Value Type='Counter'>0</Value></Gt>"+
            "</Where>"+
            "<OrderBy>"+
                "<FieldRef Name='ID' Ascending='TRUE'/>"+
            "</OrderBy>";
        var viewFields = "<FieldRef Name='Parent'/>"+
                "<FieldRef Name='ProcessGoal'/>"+
                "<FieldRef Name='Schema_to_be'/>"+
                "<FieldRef Name='Schema_as_is'/>"+
                "<FieldRef Name='Schema_as_is_e'/>"+
                "<FieldRef Name='Schema_as_is_d'/>"+
                "<FieldRef Name='Schema_to_be_e'/>"+
                "<FieldRef Name='Schema_to_be_d'/>"+
                "<FieldRef Name='DescriptionWiki'/>"+
                "<FieldRef Name='ProcessType'/>";
        var rows = getSPListItems(processListName,queryString,viewFields); //получаем весь список процессов
        var flatObject = getFlatObjectsFromRows(rows); //do adjacency list 

        function getFlatObjectsFromRows(rows) {
            var returnArray = [];
            $.each(rows, function (index, row) {
                returnArray.push(convertRowToObject(row));
            });
            return returnArray;

            function convertRowToObject(row) {//converts xml-row of precess to the object in the tree
                $row = $(row);
                var obj = { //returning object
                    id: $row.attr("ows_ID"),
                    title: $row.attr("ows_Title"),
                    parent: null,
                    type: null,
                    processOwsRow: row, //row.outerHTML, //not supported by IE11
                    expanded: true,
                    schemas: { //host object for schemas ids. Id from SP-lib
                        to_be_descriptive_id:null,
                        to_be_analytic_id:null,
                        to_be_executable_id:null,
                        as_is_descriptive_id:null,
                        as_is_analytic_id:null,
                        as_is_executable_id:null
                    } 
                }
                try { obj.descriptionWiki = $row.attr("ows_DescriptionWiki").split(";#")[0];}  catch(e) {  };
                try { obj.parent = $row.attr("ows_Parent").split(";#")[0];}  catch(e) { };
                try { obj.type = $row.attr("ows_ProcessType")}  catch(e) { };
                
                //"as_is_descriptive_id":
                try { 
                    obj.schemas.as_is_descriptive_id = $row.attr("ows_Schema_as_is_d").split(";#")[0];
                    obj.schema_id = obj.schemas.as_is_descriptive_id;
                }  catch(e) {} ;

                //"to_be_descriptive_id":
                try { 
                    obj.schemas.to_be_descriptive_id = $row.attr("ows_Schema_to_be_d").split(";#")[0];
                    obj.schema_id = obj.schemas.to_be_descriptive_id;
                }  catch(e) {} ;

                //"as_is_executable_id":
                try { 
                    obj.schemas.as_is_executable_id = $row.attr("ows_Schema_as_is_e").split(";#")[0];
                    obj.schema_id = obj.schemas.as_is_executable_id;
                }  catch(e) {} ;

                //"to_be_executable_id":
                try { 
                    obj.schemas.to_be_executable_id = $row.attr("ows_Schema_to_be_e").split(";#")[0];
                    obj.schema_id = obj.schemas.to_be_executable_id;
                }  catch(e) {} ;

                //"as_is_analytic_id":
                try { 
                    obj.schemas.as_is_analytic_id = $row.attr("ows_Schema_as_is").split(";#")[0];
                    obj.schema_id = obj.schemas.as_is_analytic_id;
                }  catch(e) {} ;

                try { 
                    obj.schemas.to_be_analytic_id = $row.attr("ows_Schema_to_be").split(";#")[0];
                    obj.schema_id = obj.schemas.to_be_analytic_id; //Схема to_be является более приоритетной, поэтому схемой по умолчанию становится именно она.
                }  catch(e) {} ;

                if ($row.attr("ows_ID")== process.id) { //initiate displaying process object by docID from url
                    process = obj;
                    schema.id = obj.schema_id;
                }
                var allSchemasOfProcess = obj.schemas.to_be_analytic_id+";"+
                    obj.schemas.as_is_analytic_id+";"+
                    obj.schemas.to_be_executable_id+";"+
                    obj.schemas.as_is_executable_id+";"+
                    obj.schemas.to_be_descriptive_id+";"+
                    obj.schemas.as_is_descriptive_id;
                var fileIdFromUrlParam = getParameterByName("fileID"); 
                if (fileIdFromUrlParam) {
                    if (allSchemasOfProcess.indexOf(fileIdFromUrlParam)>-1) { //initiate displaying process object by fileID
                        process = obj;
                        schema.id = fileIdFromUrlParam; 
                    }
                }
                return obj;
            }
        }
        function adjacencyListToHierarchicalList (flat) {
                var nodes = [];
                var toplevelNodes = [];
                var lookupList = {};

                for (var i = 0; i < flat.length; i++) {
                    var n = { //TODO: change to any number of attr.
                        id: flat[i].id,
                        title: flat[i].title,
                        parent_id: ((flat[i].parent == 0) ? null : flat[i].parent),
                        type: flat[i].type,
                        schema_id: flat[i].schema_id,
                        processOwsRow: flat[i].processOwsRow,
                        descriptionWiki: flat[i].descriptionWiki,
                        schemas: flat[i].schemas,
                        children: [],
                        row: flat[i].row
                    };
                    lookupList[n.id] = n;
                    nodes.push(n);
                    if (n.parent_id == null) {
                        toplevelNodes.push(n);
                    }
                }

                for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (!(n.parent_id == null)) {
                    lookupList[n.parent_id].children = lookupList[n.parent_id].children.concat([n]);
                }
                }
                return toplevelNodes;
        }
        var hierStructure = adjacencyListToHierarchicalList(flatObject); //do HierarchicalList
        if (tracePerf) tracePerformance("getProcessesStructure", Date.now()-startTime, "");
        return hierStructure;
    } //getProcessesStructure
    function buildProcessesTree() {
        if (tracePerf) var startTime = Date.now();
        $('#fancy_tree').fancytree({
            activeVisible: true, // Make sure, active nodes are visible (expanded).
            //autoActivate: true, // Automatically activate a node when it is focused (using keys).
            //autoCollapse: true, // Automatically collapse all siblings, when a node is expanded.
            //autoScroll: true, // Automatically scroll nodes into visible area.
            //tabbable: true, // Whole tree behaves as one single control
            extensions: ["filter"],
                filter: {
                    //autoApply: true,   // Re-apply last filter if lazy data is loaded
                    autoExpand: true, // Expand all branches that contain matches while filtered
                    counter: true,     // Show a badge with number of matching child nodes near parent icons
                    fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
                    hideExpandedCounter: true,  // Hide counter badge if parent is expanded
                    hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
                    highlight: true,   // Highlight matches by wrapping inside <mark> tags
                    leavesOnly: false, // Match end nodes only
                    nodata: true,      // Display a 'no data' status node if result is empty
                    mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
            },
            click: function(event, data) {
                // var url = data.node.data.url;
                // if (url) {
                //     tt = $.ui.fancytree.getEventTargetType(event.originalEvent);
                //     if (tt == "title") window.open(url, '_self');
                // };

                var process_id = data.node.data.id;
                if (process_id) {
                    tt = $.ui.fancytree.getEventTargetType(event.originalEvent);
                    //if (tt == "title") window.open(appUrl+"?IDdoc="+process_id, '_self');
                    if (tt == "title") {
                        data.node.setActive(); 
                        drawNewProcess(process_id);
                    }
                };
            },
            renderNode: function(event, data) {
                var node = data.node;
                //var url = node.data.url;
                var process_id = data.node.data.id;
                var $span = $(node.span);
                
                if (data.node.data.schema_id) {
                        $span.find("span.fancytree-title").css({
                            //"font-style": "italic",
                            "text-decoration": "underline",
                            "color":"Navy",
                            "cursor":"pointer"
                        });
                };
                var type = node.data.type;
                if (type) {
                    if (type == "Process") {
                        $span.find("span.fancytree-icon").css({				
                            backgroundImage: "url("+processPicUrl+")",
                            backgroundPosition: "0 0"
                        });
                    }
                    if (type == "document") {
                        $span.find("span.fancytree-icon").css({				
                            backgroundImage: "url("+processPicUrl+")",
                            backgroundPosition: "0 0"
                        });
                    }
                    if (type == "Group") {
                        $span.find("span.fancytree-title").css({				
                            fontWeight: "bold"
                        });
                        $span.find("span.fancytree-icon").css({				
                            backgroundImage: "url("+groupPicUrl+")",
                            backgroundPosition: "0 0"
                        });
                    }
                }
                // var url = node.data.url;
                // var windowUrl = window.location.href;

                //node.setExpanded(true);
                if (process_id == process.id) { //process.id is set by url
                    //$span.find("span.fancytree-title").css("background-color", "yellow");
                    //node.setSelected(true);
                    node.setActive(); 
                    //node.setFocus();//Filter is not working with this
                }                  
            },
            source: processesStructure
        }); 
        $(".fancytree-container").addClass("fancytree-connectors");

        var tree = $("#fancy_tree").fancytree("getTree");
        tree.render(true, true);
        //$("#fancy_tree").fancytree("getTree").visit(function(n){ n.setExpanded(true); }); //Open all. Very LONG !!! (~250 ms).
        if (tracePerf) tracePerformance("buildProcessesTree", Date.now()-startTime, "");
    } //buildProcessesTree
    function prepareSearchBox() {
        $("#search_input").keyup(function(e){
            var tree = $("#fancy_tree").fancytree("getTree");
            if(e.which === $.ui.keyCode.ESCAPE){
                $("#search_input").val("");
                tree.clearFilter();
                return;
            }
            var searchString = $("#search_input").val();
            tree.filterNodes(searchString);
        }).focus();
    }

    if (tracePerf) tracePerformance("prepareProcessesTree (includes getProcessesStructure() and buildProcessesTree() and prepareSearchBox()) ", Date.now()-startTime, "");
} //prepareProcessesTree

function prepareHtmlBefore(){ //before drawing tree, process and schema
    
    //$("#zz14_V4QuickLaunchMenu").hide();
    $("#s4-ribbonrow").hide();
    //$("#s4-titlerow").hide();
    
    //Добавляем в элементы Шарика табы:
    
    //var sharePointPlaceHolderId = "ctl00_PlaceHolderLeftNavBar_QuickLaunchNavigationManager";
    //var sharePointPlaceHolderId = "DeltaPlaceHolderMain";
    var sharePointPlaceHolderId = "contentRow";

    var navDiv= "<div id ='navDiv' style='width: 245px !important; float: left !important; min-width: 245px;'>"+
    //"<div id='tabs'>"+
        "<ul>"+
            //"<li><a href='#zz14_V4QuickLaunchMenu'>Сайт</a></li>"+
            "<li><a href='#ProcessesTreeTab'>Processes Tree</a></li>"+
            // "<li><a href='#LinksTreeTab'>Ссылки схемы</a></li>"+
        "</ul>"+
        "<div id ='ProcessesTreeTab'>"+
            "<input id='search_input'>"+ //здесь хостится инбокс для поиска по дереву
            "<div id='fancy_tree' style='overflow: auto;'></div>"+ //Здесь хостится дерево
        "</div>"+
        //"<div id ='LinksTreeTab'></div>"+
    //"</div>"+
    "</div>";
    $( "#"+sharePointPlaceHolderId ).prepend(navDiv);
    $( "#navDiv" ).tabs({active:0});
    $( "#contentBox" ).tabs({active:0});

    //Добавляем возможность менять ширину навигации и основного окна:
    $("#DeltaPlaceHolderMain").attr("style","width:100% !important");
    $("#contentBox").attr("style","display: flex !important");
    $("#navDiv").resizable();    
    $("#CreateDiscussionThreadBtn").button();
     $( "#slider" ).slider({ //TODO: change to +/-
        min:50,
        max:300,
        step:10,
        value: 100,
        classes: {
            "ui-slider": "highlight"
        },
        slide: function( event, ui ) {
           if (bpmnViewer) {
                var canvas = bpmnViewer.get('canvas');
                if (ui.value) {
                       canvas.zoom(ui.value/100); //canvas.zoom(ui.value*4/100);
                } //else canvas.zoom(0.5);
           } 
           else {
               if (ui.value) {
                    $("#bpmnImage").width( ui.value +"%" );
                } //else  $("#bpmnImage").width( "50%" );
           }
       }
    }).each(function() {
        // Add labels to slider whose values 
        // are specified by min, max
        // Get the options for this slider (specified above)
        var opt = $(this).data().uiSlider.options;
        // Get the number of possible values
        var vals = opt.max - opt.min;
        // Position the labels
        for (var i = 0; i <= vals; i=i+50) {
            // Create a new element and position it with percentages
            var el = $('<label>' + (i + opt.min) + '%</label>').css('left', (i/vals*100) + '%');
            // Add the element inside #slider
            $("#slider").append(el);
        }
    });

    try { 
       $("#DeltaPageStatusBar").hide(); //Design tip for "This page was modified"
       $("#zz12_TopNavigationMenu_NavMenu_Edit").hide(); //Design tip for "Change links"
    }
    catch (e) {}
}

function prepareHtmlAfter() { //after new process or schema loaded
    prepareSelectSchemaRadioButton(); 
    $( "#contentBox" ).tabs({active:0});
    updateProjectTitles();
    $("#PrintButton").button();
}

function isFileAPicture(fileName) {
     if (fileName.length > 0) {
        var blnValid = false;
        for (var j = 0; j < picturesFileExtensions.length; j++) {
            var sCurExtension = picturesFileExtensions[j];
            if (fileName.substr(fileName.length - sCurExtension.length, sCurExtension.length).toLowerCase() == sCurExtension.toLowerCase()) {
                blnValid = true;
                break;
            }
        }
        return blnValid;
    }
}

function drawSchema() {
    if (tracePerf) var startTime = Date.now(); 
      if (schema.id) {
        // $("#canvas").empty();
        // $("#statusField").empty();
        
        populateSchemaObj();

        comments = getComments(process.id);

        if (isFileAPicture(schema.Url)) {
            drawPicture_schema();
        }
        else {
            drawBPMN_schema();
        }
      } 
      else {
        $("#canvas").html("There are no schema files related with this process. Add .bpmn file to the '" + schemasListName +
        "' library and then set a value of any lookup fields of the process item in the '"+processListName+"' list");
        return;
      }
      
      
      getAndPostWikiContentPage(); //TODO: rhink about different descriptions for different shchema types

      displayGeneralDiscussion();

     //TODO: исправить это порно.
      $("#fileInfo").html("<div class='FileProperties'><span class='DescriptionProperty'>Version:</span> " + $(schema.OwsRow).attr("ows__UIVersionString")+
      "<span class='DescriptionProperty'>Last editor:</span> "+$(schema.OwsRow).attr("ows_Editor").split(";#")[1]+
      "<span class='DescriptionProperty'>Date modified:</span> "+$(schema.OwsRow).attr("ows_Last_x0020_Modified").split(";#")[1] +
      "<a href= '"+getDisplayUrlFromOwsRow ($(schema.OwsRow) ) +"'> Open file '"+$(schema.OwsRow).attr("ows_Title") +"'</a>"+
      "</div>");

    if (schema.Status) $("#statusField").html(schema.Status);
    if (tracePerf) tracePerformance("drawSchema", Date.now()-startTime, "");
}


function drawPicture_schema() {
    $("#canvas").html("<img id='bpmnImage' src='"+schema.Url+"' style='width:100%;'/>");
    fitCanvas();
}
function makePrintVersion (){
    $("#schemasSelector").remove();
    $("#statusField").remove();
    $("#fileInfo").remove();
    $("#PrintButton").remove();
    $('#contentBox').appendTo(document.head);
    $(document.body.children).remove();
    $( "<div class='PrintButton' onclick='document.location.reload(true)'>Close</div>" ).appendTo($("#toolBar"));
    $( "<div class='PrintButton' onclick='window.print()'>Print</div>" ).appendTo($("#toolBar"));
    $(".PrintButton").button();
    $('#contentBox').appendTo(document.body);
    //$('#contentBox').width("100%").height("100%");
    // $("#canvas").width("100%").
    //         height(0.95*(window.innerHeight - $("#canvas").position().top) +"px").css("overflow","auto").
    //         resizable();
    var canvas = bpmnViewer.get('canvas');
    $("#canvas").height(canvas._cachedViewbox.inner.height).width(canvas._cachedViewbox.inner.width);
}

function drawBPMN_schema() {
      
      // viewer instance
      bpmnViewer = new BpmnJS({ 
        container: '#canvas',
      });
      function openDiagram(bpmnXML) {
            // import diagram
            bpmnViewer.importXML(bpmnXML, function(err) {
                  if (err) {
                    return console.error('could not import BPMN 2.0 diagram', err);
                  }
                  // access viewer components
                  var canvas = bpmnViewer.get('canvas');
                  canvas.zoom(1.0, {x: 50, y:50});
                  
                  fitCanvas();   

                  overlays = bpmnViewer.get('overlays');
                  $.each(comments, function(index, comment) {
                    if (comment.element_id == "null") return true;
                        var elementTitle = "";
                        try {
                            var temp = $("g[data-element-id='"+comment.element_id+"']"); //TODO: сделать через elementRegistry.get('StartEvent_1'); будет быстрее?
                            var temp2= $(temp).find("text");
                            elementTitle = temp2[0].textContent;
                        }
                        catch(e) {}
                        try {
                            
                            overlays.add(comment.element_id, 'note', {
                                position: {
                                    bottom: 5,
                                    right: 5
                                },
                                html: "<div title = 'Show discussion' class='diagram-note' onclick='showCommentsThread("+index+",\""+elementTitle+"\")'>("+String(Number(comment.answersCount)+1)+")</div>"
                            });

                        //add marker
                        //canvas.addMarker(comment.element_id, 'тестовый_комментарий_в_процессе');  //comment.text.replace('"', ''));
                        } catch (e) {
                            console.log("Unable to create overlay for comment of element with id="+comment.element_id +" . Message:"+e.message);
                        }
                        
                  });

                  //overlays = bpmnViewer.get('overlays');
                  var elementRegistry = bpmnViewer.get('elementRegistry');
                  $.each(elementRegistry._elements, function(index, el) {
                      prepareElement(el);
                  });
            });
      }
      // load external diagram file via AJAX and open it
      $.get(schema.Url, openDiagram, 'text');    
}

function fitCanvas() {
    $("#s4-workspace").animate({
            //scrollTop: $("#DeltaPlaceHolderPageTitleInTitleArea").offset().top,
            scrollTop: $("#s4-titlerow").offset().top, //it is more correct after removing #s4-ribbonrow
        }, 200, 
        function() {
            $("#canvas").width("100%").
            height(0.84*(window.innerHeight - $("#canvas").position().top) +"px").css("overflow","auto").
            resizable();
        }
    );   
}
function redrawSchema(selectControl) {
    bpmnViewer = null;
    $("#canvas").empty();
    $("#statusField").empty();
    $("#ProcessDescriptionTab").empty();
    document.getElementById("frameForDisc").src = "";
    $("#SchemaLinks").empty();
    if (!schema.id) { 
        try {
            schema.id =  selectControl[selectControl.selectedIndex].value
        } catch(e) {}
     };
    drawSchema();
}

function displayGeneralDiscussion() {
    for (i=0; i<comments.length;i++) {
        if (comments[i].element_id == "null") {
            var comment = comments[i];
            var url = flatViewUrl +"?RootFolder=%2F"+comment.commentUrl.replace(/\//g, "%2F")+"&IsDlg=1"; //commentUrl="1;#bok/processes/Lists/Disc/Процесс 1
            document.getElementById("frameForDisc").src = url;
            $("#CreateDiscussionThreadBtn").hide();

            //  $("#frameForDisc").prepend("<div class='FileProperties'>"+
            //     "<span class='DescriptionProperty'>Last editor ID:</span> "+data.d.results[0].EditorId +
            //     "<span class='DescriptionProperty'>Created:</span> "+ data.d.results[0].Created +
            //     "<a href= '"+data.d.results[0].OData__dlc_DocIdUrl.Url +"'> Open wikipage </a>"+
            //     "</div>");

            return true;
        }
    }
    $("#CreateDiscussionThreadBtn").show();
}

function prepareSelectSchemaRadioButton() {
    try {
        $( "#schema-types" ).selectmenu( "destroy" );
    } catch (e) {}

    var schemasTypes= [ //TODO: change to process.schemas
        "to_be_descriptive_id",
        "to_be_analytic_id",
        "to_be_executable_id",
        "as_is_descriptive_id",
        "as_is_analytic_id",
        "as_is_executable_id"
    ];
    for (i=0;i<schemasTypes.length; i++) {
        var schemaFileId = process.schemas[schemasTypes[i]];
        var option = document.getElementById(schemasTypes[i]);
        option.disabled = true;
        if (schemaFileId >0) {
            option.disabled = false;
            if (schema.id == schemaFileId) option.selected = true;
            $(option).attr("value", schemaFileId);
        }
    }
    
    $( "#schema-types" ).selectmenu({
        change: function( event, ui ) {
            schema.id =  ui.item.element[0].value; //selectControl[selectControl.selectedIndex].value;
            if (ui.item.element[0].id.indexOf("to_be")>-1) {
                //$("span.ui-selectmenu-icon").css("background","lightgreen");
                $("#schema-types-button").css("background","lightgreen !important");             
            }
            redrawSchema();
        }
    });
}

function getComments(processID) {
  commentedElements = "";
  var temp_comments = [];
  var queryString = "<Where>"+
                      "<Eq><FieldRef Name='process_id'/><Value Type='Text'>"+processID+"</Value></Eq>"+
                    "</Where>"+              
                  "<OrderBy>"+
                      "<FieldRef Name='ID' Ascending='FALSE'/>"+
                  "</OrderBy>";

  var viewFields = "<FieldRef Name='ID'/>"+
                  "<FieldRef Name='process_id'/>"+
                  "<FieldRef Name='element_id'/>"+
                  "<FieldRef Name='Body'/>"+
                  "<FieldRef Name='_UIVersionString'/>"+
                  "<FieldRef Name='Editor'/>"+
                  "<FieldRef Name='Modified'/>"+
                  "<FieldRef Name='ItemChildCount'/>";
                  
  var rows = getSPListItems(discussionsListName, queryString, viewFields);
  $.each(rows, function (index, row){
    var $row = $(row);
    var comment = {
      process_id: process.id,
      title: $row.attr("ows_Title"),
      element_id: $row.attr("ows_element_id"),
      text: $row.attr("ows_Body"),
      editor: $row.attr("ows_Editor"),
      date: $row.attr("ows_Last_x0020_Modified"),
      version: $row.attr("ows__UIVersionString"),
      answersCount: $row.attr("ows_ItemChildCount").split(";#")[1],
      commentUrl: $row.attr("ows_FileRef").split(";#")[1] //"1;#bok/processes/Lists/Disc/Процесс 1 обсуждение 1"
    }
    temp_comments.push(comment);
    commentedElements+= $row.attr("ows_element_id") +";";
  });
  return temp_comments;
}

function showCommentsThread(index, title) {
  //$("#CommentedElementTitle-1").html("Обсуждение элемента схемы: "+title);
  var comment = comments[index];
  var url = flatViewUrl +"?RootFolder=%2F"+comment.commentUrl.replace(/\//g, "%2F")+"&IsDlg=1"; //commentUrl="1;#bok/processes/Lists/Disc/Процесс 1 обсуждение 1"
  document.getElementById("frame").src = url;
  //$("#dialog").html(htmlText);
  $( "#ShowCommentsThread" ).dialog({
      appendTo: "body",
      autoOpen: false,
      open: function(){
                      $('.ui-widget-overlay').css({"background":"black","opacity": "0.5"});
                  },
      title: "Element: "+title, //"Элемент: "+title,
      closeOnEscape: true,
      modal:true,
      maxWidth: 1050,
      minWidth: 800,
      // maxHeight: 800,
      // minHeight: 600,
      height: 600,
      buttons: [
          {
              text: "Reopen thread in new window",
              click: function() {
                  window.open(url.replace("&IsDlg=1",""), "_blank");
              }
          },
          {
              text: "Close",
              click: function() {
                  $( this ).dialog( "close" );
              }
          }
      ]
  });
  $( "#ShowCommentsThread" ).dialog( "open" );
}

//this is function for creating general discussion for entire process. See openCommentDialog for creation comments for specific bpmn-elements.
// function createDiscussionThread() {
//     openCommentDialog(null, "Create process discussion","");
// }

function openCommentDialog(element_id, name, type) {
   $("#CommentedElementTitle-2").html(name+" ( "+type+" ) ");
   $( "#CreateComment" ).dialog({
      autoOpen: false,
      open: function(){
                      $('.ui-widget-overlay').css({"background":"black","opacity": "0.5"});
                  },
      title: "Create elements discussion",//"Создать обсуждение элемента",
      closeOnEscape: true,
      modal:true,
      maxWidth: 850,
      minWidth: 620,
      maxHeight: 600,
      minHeight: 400,
      buttons: [
        //   {
        //       text: "Show solved questions",//"Показать решенные вопросы",
        //       click: function() {
        //           alert("Under construction");
        //       }
        //   },
          {
              text: "Ok", //"Создать",
              click: function() {
                  createDiscussion(process.id, element_id, document.getElementById("NewCommentInput").value);
                  //TODO: сделать ajax
                  window.open(window.location.href, "_self");
              }
          },
          {
              text: "Cancel",//"Закрыть",
              click: function() {
                  $( this ).dialog( "close" );
              }
          }
      ]
  });
  $( "#CreateComment" ).dialog( "open" );
}


function isElementMuted(id, type) {
  //if (mutedTypes.includes(type)) return true; //does not work in IE, so:
  for (i=0;i<mutedTypes.length;i++) {
      if (mutedTypes[i]== type) return true;
  }
  if (commentedElements.indexOf(id+";")>-1) return true;
}


function prepareElement(e) {
    //e - event object
    //e.element = the model element
    //e.gfx = the graphical element

    // var overlays = bpmnViewer.get('overlays');
    if (jQuery._data( e.gfx, "events" )) return;
    try {
          //Определяем, нужно ли добавлять функцию по комментированию:
          var businessObject = e.element.businessObject;
          var isMuted = isElementMuted(businessObject.id, businessObject.$type);
          var objectIdOrFalse = businessObject.id;
          if (isMuted) objectIdOrFalse = false;
          if (objectIdOrFalse) {
            //var overlays = bpmnViewer.get('overlays');
            overlays.add(objectIdOrFalse, 'note', {
              position: {
                bottom: 10,
                right: 5
              },
              html: "<div title = 'Comment this...' class='diagram-add-comment' onclick='openCommentDialog(\""+objectIdOrFalse+"\", \""+businessObject.name.replace(/\"/g, "") +"\",\""+businessObject.$type+"\")'>+</div>"
            });
          }

          //iterate properties to find properties extending BPMN 2.0 (see global vars at the top)
          var extensionElements = businessObject.extensionElements;
          var a = extensionElements.values[0];
          var properties = a.$children;
          for (i =0; i<properties.length; i++) {
            if (properties[i].name == bpmnProperties.url) 
              changeGElement(e.gfx, properties[i].value, "_blank", e.element.businessObject.name, objectIdOrFalse);
            if (properties[i].name == bpmnProperties.processId) 
              changeGElement(e.gfx, appUrl +"?IDdoc="+properties[i].value, "_self", e.element.businessObject.name, objectIdOrFalse);
          }
    }
    catch (exp) {
        //console.log(exp);
    }
}

function changeGElement(element, url, blankOrSelf, name, objectIdOrFalse){
    var elementId = $(element).attr("data-element-id");
    if(!(elementId.indexOf("_label")>0)) {
        element.addEventListener('click', function(e) {
            window.open(url, blankOrSelf)
        });
        element.title = "Go by link";
        // var log = "Ссылка на схеме: "+name+" url:"+url;
        // console.log(log);
        element.style.cursor = "pointer";

        //var newId = makeid(4);
        //element.id = newId
        //Populate Links tab:

    //     $("#LinksTreeTab").append("<div class ='LinkDiv' onmouseover='highlightLinkSVG(\""+$(element).attr("data-element-id")+"\")' onmouseout='offlightLinkSVG(\""+$(element).attr("data-element-id")+"\")'      "onclick='window.open(" + url +", \"_blank\")'>"+
    // +name+
    //     "</div>");

        $("#SchemaLinks").append("<div class ='LinkDiv' onmouseover='highlightLinkSVG(\""+elementId+"\")' onmouseout='offlightLinkSVG(\""+elementId +"\")'  onclick='window.open(\"" + 
        url +"\", \"_blank\")'>"+
        name +
        " <span class='url'> ("+url.substring(0,50)+")</span>"+
        "</div>");
    } 
}

function highlightLinkSVG(data_element_id) {
    var element = document.querySelector("#canvas [data-element-id="+data_element_id+"]");
    
    var actualX = element.getBoundingClientRect().x;
    var actualY = element.getBoundingClientRect().y;

   var canvas = bpmnViewer.get('canvas');
                  // zoom to fit full viewport
                  //canvas.zoom('fit-viewport', {x: 200, y:200});
                  //Change canvas size based on viewport size:
                  canvas.zoom(1, {x: actualX, y:actualY});

    $(element).css("stroke","red").css("stroke-width", "4px");

    //var element = $("#canvas g[data-element-id=DataObjectReference_0wxdh22]"); //children: rect, circle, polygon
}
function offlightLinkSVG(data_element_id) {
    var element = document.querySelector("#canvas [data-element-id="+data_element_id+"]");
    $(element).css("stroke","").css("stroke-width", "");    
}

function populateSchemaObj() {
  var queryString = "<Where>"+
                      "<Eq><FieldRef Name='ID'/><Value Type='Counter'>"+schema.id+"</Value></Eq>"+
                    "</Where>"+              
                  "<OrderBy>"+
                      "<FieldRef Name='ID' Ascending='FALSE'/>"+
                  "</OrderBy>";
  var viewFields = "<FieldRef Name='ID'/>"+
                  "<FieldRef Name='Title'/>"+
                  "<FieldRef Name='_UIVersionString'/>"+
                  "<FieldRef Name='Status'/>";
                  //"<FieldRef Name='Parent'/>";
  var rows = getSPListItems(schemasListName, queryString, viewFields);
  schema.OwsRow = rows[0];
  //schema.OwsRow = rows[0].outerHTML; //$(rows[0]); //TODO: IE cannot find this prop
  //schema.OwsRow = $(rows[0]).attr("outerHTML"); 
  schema.Url = getFileUrlFromOwsRow($(rows[0]));
  schema.Status = $(schema.OwsRow).attr("ows_Status");
}

function createDiscussion(process_id, element_id, text) {
  //https://msdn.microsoft.com/en-us/library/dd947220(v=office.12).aspx
  var mime_message = {
    "Message-id": makeid(6),
    "Thread-index": makeid(22),
    //"to": "email1@example.com",
    // "cc": "email2@example.com",
    "subject": process_id + "__" + element_id,
    // "fromName": "John Smith",
    //"from": "john.smith@mail.com",
    "body": text,
    //"cids": [],
    "attaches" : [], //requried in mime,
  };
var mimeTxt = Mime.toMimeTxt(mime_message);

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('POST', serviceURL, false); //../_vti_bin/Lists.asmx
  strXML = "<?xml version='1.0' encoding='utf-8'?>"+
            "<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'>"+
              "<soap12:Body>"+
              "<AddDiscussionBoardItem xmlns='http://schemas.microsoft.com/sharepoint/soap/'>"+
                "<listName>"+ discussionsListName +"</listName>"+
                "<message>"+btoa(mimeTxt)+"</message>"+
              "</AddDiscussionBoardItem>"+
              "</soap12:Body>"+
            "</soap12:Envelope>";
  xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=\"utf-8\"');
  xmlhttp.setRequestHeader('SOAPAction', 'http://schemas.microsoft.com/sharepoint/soap/AddDiscussionBoardItem');
	xmlhttp.send(strXML);
	if(xmlhttp.status == 200) {
        var response = xmlhttp.responseText ;
        xmlDoc = $.parseXML(response);
        $xml = $( xmlDoc );
        var zrow = $xml.find("z\\:row, row"); //эта хуйня нужна для разных браузеров, вроде бы Хром ищет по row, а остальные по z\\:row.
        //TODO: можно не создавать дополнительные поля process_id и element_id, а парсить заголовок.
        updateDiscListItem($(zrow).attr("ows_ID"), process_id, element_id );
    } else {
        console.log("Web-service returns error!");
        console.log("Status: "+ xmlhttp.status);
        console.log("Response text: " + xmlhttp.responseText);
    }
}

function updateDiscListItem(itemID, process_id, element_id ) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', serviceURL, false); //"../_vti_bin/Lists.asmx"
    strXML = "<?xml version='1.0' encoding='utf-8'?>"+
            "<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'>"+
              "<soap12:Body>"+
                "<UpdateListItems xmlns='http://schemas.microsoft.com/sharepoint/soap/'>"+
                      "<listName>"+ discussionsListName +"</listName>"+
                "<updates>"+
                "<Batch OnError='Continue'>"+
                    "<Method ID='1' Cmd='Update'>"+
                        "<Field Name='ID'>"+itemID+"</Field>"+
                        "<Field Name='process_id'>"+process_id+"</Field>"+
                        "<Field Name='element_id'>"+element_id+"</Field>"+
                    "</Method>"+
                    "</Batch>"+
                  "</updates>"+
                "</UpdateListItems>"+                
              "</soap12:Body>"+
            "</soap12:Envelope>";
    xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=\"utf-8\"');
    xmlhttp.setRequestHeader('SOAPAction', 'http://schemas.microsoft.com/sharepoint/soap/UpdateListItems');
	  xmlhttp.send(strXML);
	  if(xmlhttp.status == 200) {
        var response = xmlhttp.responseText ;
		xmlDoc = $.parseXML(response);
		$xml = $( xmlDoc );
		return $xml.find("z\\:row, row"); //эта нужно для разных браузеров, вроде бы Хром ищет по row, а остальные по z\\:row.
    } else {
        console.log("Web-service returns error!");
        console.log("Status: "+ xmlhttp.status);
        console.log("Response text: " + xmlhttp.responseText);
    }
}

function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function getDisplayUrlFromOwsRow($row) {
    try { //by ows_MetaInfo attribute
        var t = $(schema.OwsRow).attr("ows_MetaInfo").split("_dlc_DocIdUrl:SW|")[1];
        return t.split(",")[0];
    }
    catch (e) { //if something went wrong. By relative way. will return wrong path, if files are located in folders. No garantees
        var itemId = $row.attr("ows_ID");
        var fileRef = $row.attr("ows_FileRef"); //Пример: ows_FileRef="2;#plan/ftp/Lists/Contracts/folder1/2_.000"/>"
        tempString = fileRef.split(";#")[1];
        tempString2 = tempString.substring(tempString.lastIndexOf("/"));
        tempString = tempString.split(tempString2)[0];
        return "/"+tempString+"/Forms/DispForm.aspx?ID="+itemId;//+"&isDlg=1";
    }

}


function getFileUrlFromOwsRow($row) {
  var itemId = $row.attr("ows_ID");
    var fileRef = $row.attr("ows_FileRef"); //Пример: ows_FileRef="5;#bok/processes/BPMN/Завершение проекта.bpmn" //только если айтем - это файл
    tempString = fileRef.split(";#")[1];
    return window.location.origin + "/"+tempString;
}

//var testName = "http://project/plan/ftp/Wiki/%D0%9E%D0%BF%D0%B8%D1%81%D0%B0%D0%BD%D0%B8%D0%B5%20%D0%B0%D0%B2%D1%82%D0%BE%D0%B4%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%BA%D0%B8%20(%D0%B7%D0%B0%D0%B1%D0%BE%D1%80)%20%D1%87%D0%B5%D1%80%D0%B5%D0%B7%20%D0%94%D0%9B%D0%A2.aspx";

//Here is REST API... Fake it till you make it...
function getAndPostWikiContentPage() {
    if (process.descriptionWiki) {
        $.ajax({
            //        url: "http://project/plan/ftp/_api/web/Lists/getbytitle('"+wikiName+"')/items?$filter=Url eq "+pageId,
            url: "../_api/web/Lists/getbytitle('"+wikiLibName+"')/items?$filter=Id eq "+process.descriptionWiki,
            type: "GET",
            headers: {
                "ACCEPT": "application/json;odata=verbose"
            },
            success: function (data) {
                if (data.d.results[0]) {
                    var wikiContent = data.d.results[0].WikiField;
                    $( "#ProcessDescriptionTab" ).html(wikiContent);

                    //TODO: исправить это порно.
                    $("#ProcessDescriptionTab").prepend("<div class='FileProperties'>"+
                    "<span class='DescriptionProperty'>Last editor ID:</span> "+data.d.results[0].EditorId +
                    "<span class='DescriptionProperty'>Created:</span> "+ data.d.results[0].Created +
                    "<a href= '"+data.d.results[0].OData__dlc_DocIdUrl.Url +"'> Open wikipage </a>"+
                    "</div>");
                }
            }
        });
    } else console.log("there is no wiki page for this process");
}


function drawNewProcess(projectSearchID) {
    process = null;
    schema = null;
    searchProcessInStructure(projectSearchID, processesStructure);
    redrawSchema();
    //updateProjectTitles();
    prepareHtmlAfter();
    updateUrl();  
}

function updateUrl() {
    history.pushState(null, null, window.location.pathname +"?IDdoc="+process.id);
}

function searchProcessInStructure(searchID, array) {
    if (!process) {
        $.each(array, function(index, processInStructure){
            if (processInStructure.id == searchID) {
                process = processInStructure;
                schema = { //create new schema object
                    id: processInStructure.schema_id
                }
                return true;
            }
            if (processInStructure.children.length > 0) searchProcessInStructure(searchID, processInStructure.children);  
        })
    }
}

function updateProjectTitles() {
    //$("#ProcessName").text(processOwsRow.attr("ows_Title"));
    $("#DeltaPlaceHolderPageTitleInTitleArea").text($(process.processOwsRow).attr("ows_Title"));
    document.title = $(process.processOwsRow).attr("ows_Title");
}



//not nessecary with tree.render(true, true);
function openSelectedNode() {
    var tree = $("#fancy_tree").fancytree("getTree");

    setTimeout(function() { 
        $("#fancy_tree").fancytree("getTree").visit(function(n){ n.setExpanded(false); }); //закрываем все ноды    
    }, 100);
    
    setTimeout(function() { 
        var selectedNodes = tree.getSelectedNodes();
        var node = selectedNodes[0];
        while (node) {
            node.setExpanded(true);
            node = node.parent;
        }
    }, 2000);
}

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function initiateGlobalPaths() {
    appUrl = window.location.pathname;
    serviceURL = window.location.href.split("SitePages")[0]+"_vti_bin/Lists.asmx";
    flatViewUrl = window.location.href.split("SitePages")[0] +"Lists/"+discussionsListName+"/Flat.aspx";
    processPicUrl = window.location.href.split("SitePages")[0] +"Scripts/images/process.gif";
    try {
        var context = new SP.ClientContext;
        serviceURL = window.location.protocol + "//" + window.location.host +"/" + context.get_url() + "/_vti_bin/Lists.asmx";
        flatViewUrl = window.location.protocol + "//" + window.location.host +"/" + context.get_url() + "/Lists/"+discussionsListName+"/Flat.aspx";
    } catch(e) {
        //console.log("Unable to initiate global paths through Sharepoint context (SP.ClientContext). Paths are calculated by url (some errors may occur) "+ e.message);
    }
}
	

//Not used yet
function saveCache(ID) {
    var string = JSON.stringify(processesStructure);
    //Check existance of cache ID:
    queryString =  "<Where>"+
	            "<Eq><FieldRef Name='Title'/>"+
	              "<Value Type='Text'>"+ID +"</Value>"+
	            "</Eq>"+
	          "</Where>";
    viewFields = "<FieldRef Name='ID'/>";
    
    rows = getSPListItems(cacheListName, queryString,viewFields );
    methodString = "";
    if (rows.length == 1) { //Method Update
        row = $(rows[0]);

        methodString ="<Method ID='1' Cmd='Update'>"+
            "<Field Name='ID'>"+row.attr("ows_ID")+"</Field>"+
            "<Field Name='Cache'>"+string+"</Field>"+
        "</Method>";
    };
    if (rows.length == 0) { //Method New
        methodString ="<Method ID='1' Cmd='New'>"+
            "<Field Name='Title'>"+ID+"</Field>"+
            "<Field Name='Cache'>"+string+"</Field>"+
        "</Method>";
    };
    if (rows.length>1) {
        console.log("Error: found multiple record for cache ID="+ID);
    };

	strXML = "<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'>"+
	  "<soap12:Body>"+
	    "<UpdateListItems xmlns='http://schemas.microsoft.com/sharepoint/soap/'>"+
		  "<listName>"+ cacheListName +"</listName>"+
        "<updates>"+
		  "<Batch OnError='Continue'>"+
            methodString+
            "</Batch>"+
            "</updates>"+
		"</UpdateListItems>"+
	  "</soap12:Body>"+
	"</soap12:Envelope>";
	
    var xmlhttp2 = new XMLHttpRequest();
    xmlhttp2.open('POST',serviceURL, false);
	xmlhttp2.setRequestHeader('Content-Type', 'text/xml; charset="utf-8\"');
    xmlhttp2.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/UpdateListItems");
	xmlhttp2.send(strXML);
	
	if(xmlhttp2.status == 200) {
        var response = xmlhttp2.responseText ;
	} else {
        console.log("Error while saving cache. Message: "+xmlhttp2.status);
        return null;
    }
}



//Not used yet
function loadFromCache(ID) {
    queryString =  "<Where>"+
            "<And>"+
				"<Eq><FieldRef Name='Title'/><Value Type='Text'>"+ID +"</Value></Eq>"+
                "<Gt><FieldRef Name='Modified' /><Value Type='DateTime'><Today OffsetDays='-"+cache_TTL_days+"' /></Value></Gt>"+
            "</And>"+
		"</Where>";
    viewFields = "<FieldRef Name='Cache'/>";
    rows = getSPListItems(cacheListName, queryString, viewFields);

    if (rows.length == 1) {
        $row = $(rows[0]);
        return JSON.parse ($row.attr("ows_Cache"));
        console.log("Загружено из кэша");
    }
    if (rows.length > 1) console.log("Найдено больше записей кэша для ID="+ID);
}

//log times in console
function tracePerformance(functionName, time, comment) {
    console.log(functionName+": "+ time +" ms. "+comment);
}

//Wrapper for SP-web-service GetListItems
function getSPListItems(listName, queryString, viewFields) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('POST', serviceURL, false); //here was serviceUrl instead of "../_vti_bin/Lists.asmx"
            strXML = "<?xml version='1.0' encoding='utf-8'?>"+
            "<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://schemas.xmlsoap.org/soap/envelope/'>"+
            "<soap12:Body>"+
            "<GetListItems xmlns='http://schemas.microsoft.com/sharepoint/soap/'>"+
                "<listName>"+ listName +"</listName>"+
                "<query>"+
                    "<Query>"+
                        queryString+
                    "</Query>"+
                "</query>"+
                "<viewFields>"+
                    "<ViewFields>"+
                            viewFields+
                    "</ViewFields>"+
		        "</viewFields>"+
                "<rowLimit>"+
                        "1000"+
                "</rowLimit>"+
                "<queryOptions>"+
                    "<QueryOptions>"+
                        "<ViewAttributes Scope='RecursiveAll'></ViewAttributes>"+
                    "</QueryOptions>"+
                "</queryOptions>"+
                "</GetListItems>"+
            "</soap12:Body>"+
            "</soap12:Envelope>";
            xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=\"utf-8\"');
            xmlhttp.setRequestHeader('SOAPAction', 'http://schemas.microsoft.com/sharepoint/soap/GetListItems');
            
            xmlhttp.send(strXML);
            if(xmlhttp.status == 200) {
                var response = xmlhttp.responseText ;
                xmlDoc = $.parseXML(response);
                $xml = $( xmlDoc );
                return $xml.find("z\\:row, row"); //эта нужно для разных браузеров, вроде бы Хром ищет по row, а остальные по z\\:row.
            } else {
                console.log("Web-service returns error!");
                console.log("Status: "+ xmlhttp.status);
                console.log("Response text: " + xmlhttp.responseText);
            }
}

// var testFileNam = "http://project/plan/ftp/BPMN/автодоставка отвоз НТК.bpmn";
// function getFolder() {
//     $.ajax({
//         url: "http://project/plan/ftp/_api/web/GetFileByServerRelativeUrl('/plan/ftp/BPMN/автодоставка отвоз НТК.bpmn')/$value",
//         type: "GET",
//         headers: {
//             "ACCEPT": "application/json;odata=verbose"
//         },
//         success: function (data) {
//             if (data.d.results[0]) {
//                 return data.d.results[0].WikiField;
//             }
//         }
//     });
// }


//get wiki page content by url. It works
// function getAndPostWikiContent(link) {
//     link = "http://project/plan/ftp/Wiki/%D0%9F%D1%80%D0%BE%D1%82%D0%BE%D0%BA%D0%BE%D0%BB%20%D0%B2%D1%81%D1%82%D1%80%D0%B5%D1%87%D0%B8%20%D0%BF%D0%BE%20%D0%94%D0%A1%20%D0%B4%D0%BB%D1%8F%20%D0%B2%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%20%D1%81%D1%85%D0%B5%D0%BC%D1%8B%20%D1%81%20Synerdocs.%2018.04.2019.aspx";
//     $.get( link, function( data ) {
//         var $data =	$(data);
//         var wikiContent = $(".ms-wikicontent", $data);
//         $( "#ProcessDescriptionTab" ).html( wikiContent[0].innerHTML );
//     });
// }

function getContextInfo() {
    $.ajax({
        url: "http://project/plan/ftp/_api/contextinfo",
        type: "POST",
        headers: {
            "ACCEPT": "application/json;odata=verbose"
        },
        success: function (data) {
            if (data.d.results[0]) {
                return data.d.results[0].WikiField;
            }
        }
    });
}


// $(document).ready(function() {  
//         SP.SOD.executeFunc('sp.js', 'SP.ClientContext', ViewItem);  
//     });  

// var oListViews;  

// function createListView() {  
//     //Get client context,web and list object   
//     var clientContext = new SP.ClientContext();  
//     var oWebsite = clientContext.get_web();  
//     var oList = oWebsite.get_lists().getByTitle('ProcessesList');  
//     //Set the view fields  
//     var viewFields = new Array('Title');  
//     var viewType = new SP.ViewType();  
//     //Create view using ViewCreationInformation object   
//     var creationInfo = new SP.ViewCreationInformation();  
//     creationInfo.set_title("CustomProductView");  
//     creationInfo.set_setAsDefaultView("true");  
//     creationInfo.set_rowLimit("10");  
//     creationInfo.set_personalView("false");  
//     creationInfo.set_viewFields(viewFields);  
//     //Set CAML query so that the view shows only a subset of items  
//     var camlQuery = new SP.CamlQuery();  
//     var query = "<Where><IsNotNull><FieldRef Name='ID' /></IsNotNull></Where>";  
//     camlQuery.set_viewXml(query);  
//     creationInfo.set_query(camlQuery);  
//     oListViews = oList.get_views().add(creationInfo);  
//     //Load the client context and execute the batch   
//     clientContext.load(oListViews);  
//     clientContext.executeQueryAsync(QuerySuccess, QueryFailure);  
// }  

// function QuerySuccess() {  
//     console.log("Views created successfully!");  
// }  

// function QueryFailure(sender, args) {  
//     console.log('Request failed' + args.get_message());  
// }

// function ViewItem() {
//     var context = new SP.ClientContext.get_current();
//     var web = context.get_web();
//     var list = web.get_lists().getByTitle('Disc');

//     var query = SP.CamlQuery.createAllItemsQuery();
//     allItems = list.getItems(query);
//     context.load(allItems, 'Include(Title)');

//     context.executeQueryAsync(Function.createDelegate(this, this.success), Function.createDelegate(this, this.failed));
// }

// function success() {
//     var TextFiled = "";
//     var ListEnumerator = this.allItems.getEnumerator();
//     $('#ProcessDescription').append('<ul>');
//     while(ListEnumerator.moveNext()) {
//         var currentItem = ListEnumerator.get_current();
//         $('#ProcessDescription').append('<li>'+currentItem.get_item('Title') + '</li>\n');
//     }
//     $('#ProcessDescription').append('</ul>');
// }

// function failed(sender, args) {
//     alert("failed. Message:" + args.get_message());
// }