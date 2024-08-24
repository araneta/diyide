// get element
const container = document.getElementById('editor-container');
const tabsContainer = document.getElementById('editor-tabs');
const breadcrumbsDiv = document.getElementById('breadcrumbs');
const functionDropdown = document.getElementById('functionDropdown');

const splitter = document.getElementById('splitter');
const pane1 = document.getElementById('pane1');
const pane2 = document.getElementById('pane2');
const firstRow = document.getElementById('first-row');
const secondRow = document.getElementById('second-row');

function setStatusProcess(text){
	$('#statusProcess').html(text);
}
function jQueryGetElement(sel){
	return $(sel);
}
