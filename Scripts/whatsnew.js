
var serviceURL = window.location.href.split("default.aspx")[0]+"_vti_bin/Lists.asmx";
var lists = ["BPMN",
            "ProcessesList",
            "Disc",
            "Wiki",
            "Docs"
                ];
var finalRows = [];
var itemsLimitPerReq = 100;
var daysOffset = 5;

var htmlDataTable = "<div><table id='whatsnew_table'><thead>"+
        "<tr>"+
            "<th> </th>"+
            "<th>Title</th>"+
            "<th>Edited</th>"+
            "<th>Editor</th>"+
            "<th>Location</th>"+
        "</tr>"+
    "</thead>"+
    "<tbody>";

$(document).ready(function() {
    getNewlyUpdatedItems ();
})

function getNewlyUpdatedItems () {

    var currentDateTime = new Date(); 
    currentDateTime.setDate(currentDateTime.getDate()-daysOffset);
    var datetimeString = currentDateTime.toISOString();
    
    // "Last Sync: " + currentdate.getDate() + "/"
    //                 + (currentdate.getMonth()+1)  + "/" 
    //                 + currentdate.getFullYear() + " @ "  
    //                 + currentdate.getHours() + ":"  
    //                 + currentdate.getMinutes() + ":" 
    //                 + currentdate.getSeconds();

    var queryString = 
    "<Where>"+
       //"<And>"+
          "<Gt><FieldRef Name='Modified' /><Value IncludeTimeValue='TRUE' Type='DateTime'>"+datetimeString+"</Value></Gt>"+
          //"<In><FieldRef Name='ContentType'/><Values><Value Type='Computed'>Элемент</Value><Value><Value Type='Computed'>Документ</Value></Values></In>"+ //bad request
          //ContentTtype элемента, документа начинается с 0x010. Папки начинаются с 0x012
          //"<Or>"+
          //  "<BeginsWith><FieldRef Name='ContentType'/><Value Type='Text'>Element</Value></BeginsWith>"+ //элемент, документ. Папки начинаются с 0x012
          //  "<BeginsWith><FieldRef Name='ContentType'/><Value Type='Text'>Document</Value></BeginsWith>"+ 
          //"</Or>"+
       //"</And>"+
    "</Where>"+
    "<OrderBy>"+
        "<FieldRef Name='Modified' Ascending='FALSE'/>"+
    "</OrderBy>";
    ;
    for (var i = 0; i < lists.length; i++) {
        var listName = lists[i];
        try {    
        var temp = getSPListItems(listName, queryString);
        $.each(temp, function (index, temp_value){
            convertRowToTableTr(temp_value, listName);
        })

        finalRows = finalRows.concat(temp);
        } catch(e) {}
    }


    htmlDataTable+="</tbody></table></div>";

    $("#whatsnew_table_div").html(htmlDataTable);
    $("#whatsnew_table_div").attr("style", "padding: 10px; margin: 10px;");
    $("#whatsnew_table").DataTable({
         "order": [ 2, "desc" ],
         "pageLength": 50
    });
}


function convertRowToTableTr(row, listName) {

    $row = $(row);
    var imgLink = "/_layouts/15/images/icgen.gif";
    var link = "";
    var title = "";
    var newIconHtml = "";
    var t = $row.attr("ows_FileRef").split(";#")[1];
    var locationLink = "/"+ t.substr(0, t.lastIndexOf("/"));
    var docIcon = $row.attr("ows_DocIcon");

    if (docIcon) { //файлы
        //link = "/" + $row.attr("ows_FileRef").split(";#")[1] //ссылка на сам документ
        imgLink = "/_layouts/15/images/ic"+docIcon+".gif";
        if (docIcon == "pdf") imgLink = "/_layouts/15/images/icpdf.png";
        
        
        var temp = t.split("/"); //"77;#plan/ftp/Shared Documents/Администрирование/Статус задач по ТЦО (только РП).xlsx
        link = "/" + temp[0] + "/" + temp[1]+"/" + temp[2]+ "/" + temp[3]+"/Forms/DispForm.aspx?Id="+ $row.attr("ows_ID"); //костыль. Не будет работать на субсайтах следующего уровня
        title = $row.attr("ows_FileLeafRef").split(";#")[1];
        
        //type= "Документ ("+listName+")";
             
    }
    else { //элементы
        
        
        link = locationLink +"/DispForm.aspx?ID="+ $row.attr("ows_ID");
        title = $row.attr("ows_Title");
        //type = "Элемент ("+listName+")";
    }  
    //Определяем, это новый элемент или измененный.
    if ($row.attr("ows_Modified") == $row.attr("ows_Created")) 
        newIconHtml = "<span class='ms-newdocument-iconouter'><img class='ms-newdocument-icon' src='/plan/_catalogs/theme/Themed/217001E5/spcommon-B35BB0A9.themedpng?ctag=0' alt='новый' title='новый'></span>";

    htmlDataTable +="<tr>"+
                "<td><img border='0' width='16' height='16' src = '"+ imgLink + "'/></td>"+
                "<td><a href = '"+ link + "'>"+title+"</a>"+newIconHtml+"</td>"+
                "<td>"+$row.attr("ows_Modified")+"</td>"+
                "<td>"+$row.attr("ows_Editor").split(";#")[1]+"</td>"+
                "<td><a href = '"+locationLink+"'>" + listName + "</a></td>"+
            "</tr>";
}

//Обертка к методу веб-сервиса GetListItems
function getSPListItems(listName, queryString) {

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST',serviceURL, false);
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
			    "<FieldRef Name='ID'/>"+
                "<FieldRef Name='Title'/>"+
                "<FieldRef Name='Modified'/>"+
                "<FieldRef Name='ModifiedBy'/>"+
                "<FieldRef Name='Editor'/>"+
                "<FieldRef Name='Created'/>"+
                "<FieldRef Name='ContentType'/>"+
                "<FieldRef Name='FSObjType'/>"+
                "<FieldRef Name='FileLeafRef'/>"+
                "<FieldRef Name='DocIcon'/>"+
                "<FieldRef Name='ContentTypeId'/>"+
			"</ViewFields>"+
		   "</viewFields>"+
           "<rowLimit>"+
                itemsLimitPerReq+
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
    
    try {
	xmlhttp.send(strXML);
	if(xmlhttp.status == 200) {
        var response = xmlhttp.responseText ;
		xmlDoc = $.parseXML(response);
		$xml = $( xmlDoc );
		return $xml.find("z\\:row, row"); //эта нужно для разных браузеров, вроде бы Хром ищет по row, а остальные по z\\:row.
    } else {
        console.log("Ошибка обращения к веб-сервису");
        console.log("Код статуса: "+ xmlhttp.status);
        console.log("Ответ: " + xmlhttp.responseText);
    }
    } catch(e) { return false;}

}