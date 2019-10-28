<%@ Page language="C#" MasterPageFile="~masterurl/default.master"    Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage,Microsoft.SharePoint,Version=16.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c" meta:progid="SharePoint.WebPartPage.Document"  %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Import Namespace="Microsoft.SharePoint" %> <%@ Assembly Name="Microsoft.Web.CommandUI, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<asp:Content ContentPlaceHolderId="PlaceHolderPageTitle" runat="server">
	<SharePoint:EncodedLiteral runat="server" text="<%$Resources:wss,multipages_homelink_text%>" EncodeMethod="HtmlEncode"/> 
	- 
	<SharePoint:ProjectProperty Property="Title" runat="server"/>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderPageImage" runat="server"><img src="/_layouts/15/images/blank.gif?rev=43" width='1' height='1' alt="" data-accessibility-nocheck="true"/></asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderPageTitleInTitleArea" runat="server">
			<label class="ms-hidden">
<SharePoint:ProjectProperty Property="Title" runat="server"/></label>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderTitleAreaClass" runat="server">
<SharePoint:UIVersionedContent runat="server" UIVersion="<=3">
	<ContentTemplate>
		<style type="text/css">
		td.ms-titleareaframe, .ms-pagetitleareaframe {
			height: 10px;
		}
		div.ms-titleareaframe {
			height: 100%;
		}
		.ms-pagetitleareaframe table {
			background: none;
			height: 10px;
		}
		</style> </ContentTemplate>
</SharePoint:UIVersionedContent>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderAdditionalPageHead" runat="server">
	<meta name="CollaborationServer" content="SharePoint Team Web Site" />
	
<!--Custom code START-->
<meta name="ProgId" content="SharePoint.WebPartPage.Document" />
<!--
Lifehack: in masterpage switch the order of the PlaceHolderAdditionalPageHead and X-UA-Compatible meta-tag.
So, all scripts in SP13 will work in IE-10 campatipility mode (like WYSIWYG-editor in rch text fields) , only this page will work in Edge-mode

-->
<meta http-equiv="X-UA-Compatible" content="IE=Edge" />
	
	<link rel="stylesheet" type="text/css" href="../Scripts/BPMN.css"/>    
	<link rel="stylesheet" type="text/css" href="../Scripts/comments.css"/>    
    <link rel="stylesheet" type="text/css" href="../Scripts/skin-win8/ui.fancytree.css"/>
    <link rel="stylesheet" type="text/css" href="../Scripts/jquery-ui/jquery-ui.theme.min.css"/>
    <link rel="stylesheet" type="text/css" href="../Scripts/jquery-ui/jquery-ui.structure.min.css"/>
    <link rel="stylesheet" type="text/css" href="../Scripts/jquery-ui/jquery-ui.min.css"/>	    
	
	<script src="../Scripts/bpmn-navigated-viewer.production.min.js"></script>    
    
    <script src="../Scripts/jquery.js"></script>
    <script src="../Scripts/jquery-ui/jquery-ui.min.js"></script>
    <script src="../Scripts/jquery.fancytree.js"></script>
    <script src="../Scripts/jquery.fancytree.filter.js"></script>
    <script src="../Scripts/mime-js.min.js"></script>
    <script src="../Scripts/base64.js"></script>
    <script src="../Scripts/myBPMN.js"></script>
    <script type="text/javascript" src="../Scripts/dragscroll.js"></script>

<!--Custom code END-->

</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderMain" runat="server">
<div id="contentBoxTabs">

<ul>
	<li><a href='#SchemaTab'>Schema</a></li>
	<li><a href='#ProcessDescriptionTab'>Description</a></li>
	<li><a href='#ProcessDiscussionTab'>Discussion</a></li>
	<li><a href='#SchemaLinks'>Links</a></li>
</ul>
	<div id="SchemaTab">
<!--		<div id="ProcessName"></div>-->
		<div id="toolBar" style="height:50px">
			<fieldset id="schemasSelector">
			    <label for="schema-types">Type: </label><select name="schema-types" id="schema-types">
		    	  <option id="as_is_descriptive_id" disabled="true">AS IS: 
					descriptive</option>
		    	  <option id="as_is_analytic_id" disabled="true">AS IS: analytic</option>
		    	  <option id="as_is_executable_id" disabled="true">AS IS: 
					executable</option>
		    	  <option id="to_be_descriptive_id" disabled="true">TO BE: 
					descriptive</option>
		    	  <option id="to_be_analytic_id" disabled="true">TO BE: analytic</option>
		 	      <option id="to_be_executable_id" disabled="true">TO BE: 
					executable</option>
		    	</select></fieldset><div id="statusField"></div>
		    <div id="PrintButton" class='bpmnButton' onclick='makePrintVersion()'>
				Full screen</div>
			<div id="slider"></div>
		</div>
		<div id="canvas" class="dragscroll"></div>
		<div id="fileInfo"></div>		
	</div>
	<div id="ProcessDescriptionTab">
	</div>
	<div id="ProcessDiscussionTab">
		<div id="CreateDiscussionThreadBtn" onclick="openCommentDialog(null, 'Create process discussion','')">Create discussion</div>	
		<iframe id="frameForDisc" ></iframe>
	</div>
	<div id="SchemaLinks"></div>
	
	<div id="ShowCommentsThread" style="display:none">
		<div id="CommentedElementTitle-1">		</div>
		<iframe id="frame" ></iframe>
	</div>
	
	<div id="CreateComment" style="display:none">
		<div id="CommentedElementTitle-2" class="ui-dialog-title">		</div>
		<textarea name="comment" id="NewCommentInput"></textarea>
	</div>
	
</div>


</asp:Content>


<asp:Content ContentPlaceHolderId="PlaceHolderLeftNavBar" runat="server" Visible=false>
</asp:Content>

<asp:Content ContentPlaceHolderId="SPNavigation" runat="server" Visible=false>
</asp:Content>

<asp:Content ContentPlaceHolderId="PlaceHolderTitleBreadcrumb" runat="server" Visible=false>
</asp:Content>

<asp:Content ContentPlaceHolderId="PlaceHolderTopNavBar" runat="server" Visible=false>
</asp:Content>

<asp:Content ContentPlaceHolderId="PlaceHolderSearchArea" runat="server" Visible=false>
</asp:Content>

