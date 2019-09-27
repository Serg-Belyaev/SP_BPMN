<h2> Requirements to manual settings </h2><br/>

1. The application aspx-file (app.aspx) must be placed in SitePages folder, located in root in a web. Example: https://portal/site/web/SitePages/app.aspx
2. All files from Scripts folder must be placed in Scripts folder, located in root in a web. Example: https://portal/site/web/Scripts/
3. Sharepoint lists and libraries internal names must be set correctly as mentioned below (or you can edit names via corresponding vars in myBPMN.js). Sharepoint lists and libraries field schemas must meet the requirements below.<br/>

<b>ProcessesList </b> (var processListName) - internal name of sharepoint list for all processes. The list must have the following fields (internal names, case sensitive):<br/>
- Parent - lookup to the processes list. <br/>
- ProcessType - choice field (Process / Group).<br/>
- Schema_to_be - lookup to bpmn-schemas library (concerned as analityc "to be""). <br/>
- Schema_as_is - lookup to bpmn-schemas library  (concerned as analityc "as is""). <br/>
- Schema_to_be_d - lookup to bpmn-schemas library (concerned as descriptive "to be"").<br/>
- Schema_to_be_e - lookup to bpmn-schemas library (concerned as executable "to be""). <br/>
- Schema_as_is_d - lookup to bpmn-schemas library (concerned as descriptive "to be"").<br/>
- Schema_as_is_e - lookup to bpmn-schemas library (concerned as executable "as is"").<br/>
- DescriptionWiki - lookup to wikiLibName with description page.<br/>

<b>BPMN</b> (var schemasListName) - internal name of sharepoint library for BPMN 2.0 files. The list must have the only required fields (internal names, case sensitive): Status - single-line text. <br/>

<b>Disc</b> (var discussionsListName) - internal name of sharepoint discussion board for hosting comments.<br/>
Discussion list is a standard Sharepoint discussion board with:<br/>
- content types: discussions, messages.<br/>
- flat view is represented by Flat.aspx page<br/>
The discussion content type have additional fields:<br/>
- element_id - single line text. The field hosts element id from BPMN-schema.<br/>
- process_id - single line text. The field hosts process id from Process list.<br/>

<b> Wiki </b> (var wikiLibName) - internal name of sharepoint wiki-library with process descriptions pages. No special requirements.<br/>

<h2> How to test</h2><br/>
After setting all lists and fields:<br/>
1.	Upload your process file in BPMN library. File must be on BPMN 2.0 format. Use <a href=”https://camunda.com/products/modeler/”> Camunda modeler </a> to create one or download example <a href=”https://github.com/bpmn-io/bpmn-js-examples/tree/master/modeler/resources”> from here </a>.<br/>
Do not forget to set Title field.<br/>
2.	Create a new record in ProcessesList. Specify fields:<br/>
-	Title – name of your process.<br/>
-	Parent. Use blank for root processes<br/>
-	Use one of lookup fields to link the record with bpmn-file from previous step.<br/>
-	Set ProcessType to Process or Group.<br/>
If this record is really the first item in ProcessesList ID will be 1 after saving, else get the ID of it from display form or view with ID column.<br/>
3.	Open link http://portal/site/web/subweb/SitePages/app.aspx?IDdoc=1 <br/>
