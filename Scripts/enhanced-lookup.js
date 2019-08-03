//Здесь js, который висит в masterPage - выплоняется на всех страницих


$(document).ready(function() {
	// try {
	// 	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function() {
	// 		runFuncAfterHtmlLoad();
	// 	});
	// }
	// catch(e) {console.log("executeFunc not working");}

	// try {
	// 	SP.SOD.executeOrDelayUntilScriptLoaded(function () {
	// 		runFuncAfterHtmlLoad();
	// 	}, "sp.js")
	// }
	// catch(e) {console.log("ExecuteOrDelayUntilScriptLoaded not working");}
	
	runFuncAfterHtmlLoad();

});

// var allComments = $("*").contents().filter(function(){ return this.nodeType == 8;});
// 	$.each(allComments, function(value, comment){
// 		$comment = $(commnent);
// 		if (comment.data.lastIndexOf('FieldType="SPFieldLookupMulti"')>0) {
			
// 		}
// 	})


function runFuncAfterHtmlLoad () {
	var myInterval = setInterval(run, 500);
	function run() {
		var table = $("select[id*='Service']");
		if (table) {
			editMultiLookupWidth();
			prepareSearchBox();
			clearInterval(myInterval);
		};
	};
}



function prepareSearchBox() {
	var multilookupTableTag = $("table[id*='MultiLookup']");
	if (multilookupTableTag.length > 0) {
		$(multilookupTableTag).parent().parent().prepend("<div><input type='text' class='searchInput' style='width: 97%; background-color: moccasin;margin-bottom: 5px;'></div>");
	}
	// } else { //Single lookup
	// 	$("select[id*='LookupField']").parent().parent().prepend("<div><input type='text' class='searchInput' style='width: 97%; background-color: moccasin;margin-bottom: 5px;'></div>");;
	// }
	$( "input.searchInput" ).on('keyup', filterLookup);
}

function filterLookup (event) {
	var searchString = event.target.value;
	if (searchString.length < 3) {
		//if (searchString=="") 
			$("table[id*='MultiLookup']").find("option").show();
		return;
	}
	var searchSplit = searchString.split(" ");
	var options = $("select[id*='SelectCandidate']").find("option");
	$.each(options, function (index, a_option){
		$.each(searchSplit, function(index2, search){
			if (search == "") return false;
			if (a_option.innerText.toLowerCase().lastIndexOf(search.toLowerCase())>-1) {
				a_option.style.display = "block";
			} else {
				a_option.style.display = "none";
				return false;
			}
		});
	})
}

//Изменение ширины пикера с услугами.
function editMultiLookupWidth() {
	$("select[multiple*='multiple']").attr("style","width:400px;min-height:400px");	
}