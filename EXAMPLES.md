# Examples
#### Lua
```lua
local mmenu = exports.mmenu

RegisterCommand("Open", function()
	mmenu:Open(GetCurrentResourceName(), "menu_name",
	{
		title    = "Example",
		align    = "right",
		elements = {
			{ label = "Normal button", value = "normal_button" },
			{ label = "Normal button 2", value = "normal_button2" },
			{ label = "Normal button 3", value = "normal_button3" },
			{ label = "Slider", value = 0, min = 0, max = 10, type = 'slider' }
		}
	}, 
	function(data, menu)
		print("submitted value " .. tostring(data.current.value))
		menu.close()
	end, 
	function(data, menu)
		print("menu canceled")
		menu.close()
	end,
	function(data, menu)
		print(tostring(data.current.label) .. " changed to " .. tostring(data.current.value))
	end,
	function()
		print("menu closed")
	end)
end)
```

![](https://i.imgur.com/fTQQmsi.gif)
