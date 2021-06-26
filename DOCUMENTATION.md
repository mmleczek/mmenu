### Events
#### mmenu:status
```
@is_open	- return boolean
@namespace	- return string
@name		- return string
```
```lua
RegisterNetEvent("mmenu:status", function(is_open, namespace, name)

end)
```

### Exports

| export					| return    | explanation                                                                              |
|---------------------------|-----------|------------------------------------------------------------------------------------------|
| Open						| table     | Opens up menu. Returns menu object.
| Close						| void		| Closes up specified menu.
| CloseAll					| void		| Closes up all opened menus.
| GetMenu					| table		| Returns specified menu object. If that menu is not opened, it will return nil.
| IsOpen					| boolean	| Returns if specified menu is open or not.
| IsAnyMenuOpen 			| boolean	| Returns if any menu is open or not.
| GetAllOpenedMenus 		| table		| Returns every opened menus as an array of objects.
| AllowMenusToOpen			| void		| Sets permission to allow opening new menus.
| AllowMenusToClose			| void		| Sets permission to allow closing menus.
| PreventMenusFromOpening	| void		| Sets permission to disallow opening new menus.
| PreventMenusFromClosing	| void		| Sets permission to disallow closing menus.
| AllowMenuToOpen			| void		| Sets permission to allow opening specified menu.
| AllowMenuToClose			| void		| Sets permission to allow closing specified menu.
| PreventMenuFromOpening	| void		| Sets permission to disallow opening specified menu.
| PreventMenuFromClosing	| void		| Sets permission to disallow closing specified menu.