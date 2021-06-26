fx_version "cerulean"
game "gta5"
lua54 "yes"

author "mmleczek (mmleczek.pl)"
description "Based on original esx_menu_default https://github.com/esx-framework/esx_menu_default"
version "1.0.0"

client_script 'client.lua'

ui_page 'html/ui.html'

files {
	'html/*.html',
	'html/css/*.css',
	'html/js/*.js',
	'html/fonts/*.ttf'
}

exports {
	"Open",
	"Close",
	"CloseAll",
	"GetMenu",
	"IsOpen",
	"IsAnyMenuOpen",
	"GetAllOpenedMenus",
	"AllowMenusToOpen",
	"AllowMenusToClose",
	"PreventMenusFromOpening",
	"PreventMenusFromClosing",
	"AllowMenuToOpen",
	"AllowMenuToClose",
	"PreventMenuFromOpening",
	"PreventMenuFromClosing"
}