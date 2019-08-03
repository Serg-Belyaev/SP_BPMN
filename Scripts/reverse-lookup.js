var fieldsArray = [];
var currentItemID;

//project
var serviceURL = "http://project/plan/ftp/_vti_bin/Lists.asmx";//Урл веб-сервиса Шарика
var webUrl = "/plan/ftp/";
var redCrossUrl = "/plan/ftp/Scripts/cross.png";
var checkUrl = "/plan/ftp/Scripts/check.png";

//Дома
//var serviceURL = "http://sp-16.nordberry.com/_vti_bin/Lists.asmx";//Урл веб-сервиса Шарика
//var webUrl = "/";
//var redCrossUrl = "/Scripts/cross.png";
//var checkUrl = "/Scripts/check.png";


$(document).ready(function() {
	
	var fieldsAtags = $("a[name*='_x003e_'"); //Выбираем все теги a, в name которых есть символ ">". При названии поля Contracts>Services name будет SPBookmark_Contracts_x003e_Services
	var fieldsTDs = $(fieldsAtags).closest("td");
	var fieldsValuesTDs = $(fieldsAtags).closest("td").next("td");
	
	
	for (i = 0; i < fieldsAtags.length; i++) { 
		var innerNameSplit = $(fieldsAtags[i]).attr("name").split("_");;
		fieldsArray.push({
			externalListName: innerNameSplit[1],
			externalFieldName: innerNameSplit[3] ,
			td_for_modifying: $(fieldsValuesTDs[i])[0],
			td_for_title: $(fieldsTDs [i])[0]
		});
	}
	
	// var allComments = $("*").contents().filter(function(){ return this.nodeType == 8;});
	// $.each(allComments, function(value, comment){
	// 	$comment = $(commnent);
	// 	if (comment.data.lastIndexOf("SPFieldCalculated")>0) {
	// 		var temp1 =comment.data.split('\n'); //пример data:  FieldName="Привязанные договоры"↵			 FieldInternalName="Contracts_x003e_Services"↵			 FieldType="SPFieldCalculated"↵	
	// 		var 
	// 		fieldsArray.push({
	// 			externalListName: innerNameSplit[1],
	// 			externalFieldName: innerNameSplit[3] ,
	// 			td_for_modifying: $(fieldsValuesTDs[i])[0],
	// 			td_for_title: $(fieldsTDs [i])[0]
	// 		});
	// 	}
	// })

	currentItemID = getParameterByName("ID");
	for (i = 0; i < fieldsArray.length; i++) {
		var list = getListByInternalName(fieldsArray[i].externalListName);
		var $list = $(list);
		var listName = $list.attr("Title");

		queryString = "<Where>"+
			"<Eq>"+
			"<FieldRef Name='"+ fieldsArray[i].externalFieldName + "' LookupId='TRUE' />"+
			"<Value Type='Lookup'>" + currentItemID +"</Value>"+
			"</Eq>"+
			"</Where>"+              
			"<OrderBy>"+
                "<FieldRef Name='ID' Ascending='FALSE'/>"+
            "</OrderBy>";
    	viewFields = "<FieldRef Name='ID'/>";
	    var lookupItemsRows = getSPListItems(listName, queryString, viewFields);
    	var modCell = $(fieldsArray[i].td_for_modifying);
    	var titleCell = $(fieldsArray[i].td_for_title);
	    if (lookupItemsRows) {
	    	if (lookupItemsRows.length > 0) {
		    	var resultHtml = "";
			    $.each(lookupItemsRows, function (value, row) {
			    	$row = $(row);

					var t = $row.attr("ows_FileRef").split(";#")[1];

			    	if ($row.attr("ows_DocIcon")) { //файлы
							var temp = t.split("/"); //"77;#plan/ftp/Shared Documents/Администрирование/Статус задач по ТЦО (только РП).xlsx
							var link = "/" + temp[0] + "/" + temp[1]+"/" + temp[2]+"/Forms/DispForm.aspx?Id="+ $row.attr("ows_ID"); //костыль. Не будет работать на субсайтах следующего уровня

					    	resultHtml+= "<div>"+
							"<a href = '" + link + "'>"+					    	
					    	$row.attr("ows_FileLeafRef").split(";#")[1]+"</a>"+
					    	"</div>";			    		
			    	}
			    	else { //элементы
			    		
			    		//var t = $row.attr("ows_FileRef").split(";#")[1];
			    		var link = "/" +t.substr(0, t.lastIndexOf("/"))+"/DispForm.aspx?ID="+ $row.attr("ows_ID");
  					    	resultHtml+= "<div><a href = '"+ 
  					    	link + "'>"+
							$row.attr("ows_Title")+"</a></div>";
			    	}    	
			    });
			    modCell.html(resultHtml);
			    titleCell.prepend("<img style='float:left' src='"+checkUrl +"' />");		
   			    $(fieldsTDs[i]).children("h3").attr("style","color:green;"); // text-decoration: underline;");
				//titleCell.wrap( "<a href='"+ $list.attr("DefaultViewUrl")+"FilterField1="+ fieldsArray[i].externalFieldName + "&FilterValue1=Деловые%20Линии" +"'></a>" )

		    } else {
		    	modCell.html("<div> Нет данных </div>");
			    titleCell.prepend("<img style='float:left' src='"+redCrossUrl +"' />");
   			    $(fieldsTDs[i]).children("h3").attr("style","color:red; text-decoration: underline;");
				titleCell.wrap( "<a href='"+ $list.attr("DefaultViewUrl") +"'></a>" )

		    }
	    } else {

	    	modCell.html("<div style='color:red'> Ошибка </div>");
	    }
	}
	$("table.ms-formtable").each(function(){
		$("td:eq(0)",this).attr({"width":"200"})
	});

});



//Обертка к методу веб-сервиса GetListItems
function getSPListItems(listName, queryString, viewFields) {

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
			// "<QueryOptions>"+
        		// "<ViewAttributes Scope='RecursiveAll' />"+
    		// "</QueryOptions>"
	      "</query>"+
	      "<viewFields>"+
			"<ViewFields>"+
			    viewFields+
			"</ViewFields>"+
		   "</viewFields>"+
           "<rowLimit>"+
                "200"+
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
		return $xml.find("z\\:row, row"); //эта хуйня нужна для разных браузеров, вроде бы Хром ищет по row, а остальные по z\\:row.
    } else {
        console.log("Ошибка обращения к веб-сервису");
        console.log("Код статуса: "+ xmlhttp.status);
        console.log("Ответ: " + xmlhttp.responseText);
    }

}

//Обертка к методу веб-сервиса GetListCollection
function getListByInternalName(internalListName) {

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST',serviceURL, false);
	strXML = "<?xml version='1.0' encoding='utf-8'?>"+
	"<soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'>"+
	"<soap12:Body>"+
		"<GetListCollection xmlns='http://schemas.microsoft.com/sharepoint/soap/' />"+
	"</soap12:Body>"+
	"</soap12:Envelope>";
    xmlhttp.setRequestHeader('Content-Type', 'application/soap+xml; charset=\"utf-8\"');
    //xmlhttp.setRequestHeader('SOAPAction', 'http://schemas.microsoft.com/sharepoint/soap/GetListItems');
    
	xmlhttp.send(strXML);
	if(xmlhttp.status == 200) {
        var response = xmlhttp.responseText ;
		xmlDoc = $.parseXML(response);
		$xml = $( xmlDoc );
		var list = $xml.find("List[DefaultViewUrl*='/"+internalListName+"/']"); 
		return list;

    } else {
        console.log("Ошибка обращения к веб-сервису");
        console.log("Код статуса: "+ xmlhttp.status);
        console.log("Ответ: " + xmlhttp.responseText);
    }

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
