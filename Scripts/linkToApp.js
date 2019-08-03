var fieldsArray = [];
var currentItemID;

var webUrl = "/plan/ftp/";
var redCrossUrl = "/plan/ftp/Scripts/cross.png";
var checkUrl = "/plan/ftp/Scripts/check.png";



$(document).ready(function() {
	
	var fieldsAtags = $("a[name*='appLink'"); //
	var fieldsTDs = $(fieldsAtags).closest("td");
	var fieldsValuesTDs = $(fieldsAtags).closest("td").next("td");
	
    var modCell = fieldsValuesTDs;
	var titleCell = fieldsTDs;

	currentItemID = getParameterByName("Id");


	    
	    
		    	var resultHtml = "";
		


			    
			    			var link = "/plan/ftp/SitePages/app.aspx?fileID="+currentItemID;
  					    	resultHtml+= "<div><a href = '"+ 
  					    	link + "'>Визуализация процесса</a>";
						
			    		
			   
			    modCell.html(resultHtml);
			    titleCell.prepend("<img style='float:left' src='"+checkUrl +"' />");		
   			    $(fieldsTDs[0]).children("h3").attr("style","color:green;");    
	    
	    	//modCell.html("<div style='color:red'> Ошибка </div>");
	    
	
	$("table.ms-formtable").each(function(){
		$("td:eq(0)",this).attr({"width":"200"})
	});

});



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
