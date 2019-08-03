# SP_BPMN
<h2>Sharepoint collaboration site with bpmn.io toolset</h2>


Hello everyone!
Here you can find simple Sharepoint site extended by some process management features.
<h3>How to implement:</h3>

<b>Option A</b>
1. Download wsp-file - this is Sharepoint 2019 package. 
2. Upload it to your solution gallery (/_catalogs/solutions/) and activate
3. Create new site by using new custom BPMSP-template
This is the simplest way to deploy solution.

<b>Option B</b>
1. Open your existing site by Sharepoint designer or by windows explorer.
2. Create 2 new root folders (or be sure they already exist):<br/>
 - SitePages<br/>
 - Scripts <br/>
 Upload to the folders all files from corresponding folders of this project.
3. Set up all list and libraries required (link)<br/>
 This way is the best when:<br/>
 A) You already have a site with useful content and you want to extend it for process management<br/>
 B) You don't have administrative privileges in target Sharepoint-farm ;) This solutuon uses only client-side code, so you don't need to have access to Sharepoint servers.<br/>
 
 <h3>Features and abilities:</h3>
 1) Manage processes list: create, modify, delete processes record. Restrict permissions to processes <br/>
 2) Navigate processes with tree view with ease search powered by <a href = 'https://github.com/mar10/fancytree'>fancy tree</a><br/>
 3) Create diagrams files in Business Process Management Notation (BPMN) 2.0 by a great <a href = 'https://camunda.com/products/modeler/'>Camunda Modeller</a> (or any other soft with BPMN 2.0 support).
 Use all Sharepoint built-in features such as versions, permissions, fields, organizing with folders, opening in windows explorer and others.<br/>
 4) Web view for any diagram file in BPMN 2.0 format powered by superb <a href = 'https://github.com/bpmn-io'> bpmn.io project</a>.<br/>
 Easy navigation in large diagram: scroll, zoom and move canvas by mouse.<br/>
 5) Comment any diagram element, start discussion and get an answer<br/>
 6) Create 6 diffirent types diagrams for a process:<br/>
 - AS IS descriptive<br/>
 - AS IS analityc<br/>
 - AS IS executable<br/>
 - TO BE descriptive<br/>
 - TO BE analityc<br/>
 - TO BE executable<br/>
 7) Publish process description in wiki-page and link it to process item<br/>
 8) Publish a diagram in any notations (EPC, IDEF or others) as a picture<br/>
 9) Extend your BPMN-elements by external or internal links. For example, draw a document artifact and link it your company's policy published inside Intranet<br/>
 10) Be informed with whats' new widget<br/>
 
