local MenusManager		= {}

MenusManager.MainThreadStatus	= false
MenusManager.NInputEnabled		= false
MenusManager.IsAllowedToOpen	= true
MenusManager.IsAllowedToClose	= true

MenusManager.GuiTime			= 0
MenusManager.GuiIndexChangeRate = 150

MenusManager.PreventedFromOpening = {}

MenusManager.IsMenuPreventedFromOpening = function(namespace, name)
	if MenusManager.PreventedFromOpening[namespace] == nil then
		return false
	else
		if MenusManager.PreventedFromOpening[namespace][name] == nil then
			return false
		else
			return true
		end
	end
end

MenusManager.Keys				= {
	["ENTER"] 			= 191,
	["ESC"] 			= 200,
	["ARROWUP"] 		= 172,
	["ARROWDOWN"] 		= 173,
	["ARROWLEFT"] 		= 174,
	["ARROWRIGHT"] 		= 175,
	["LSHIFT"] 			= 21
}

MenusManager.NuiFunctions		= {
	Open = function(namespace, name, data)
		TriggerEvent("mmenu:status", true, namespace, name)
		SendNUIMessage({
			action    = "openMenu",
			namespace = namespace,
			name      = name,
			data      = data
		})
	end,
	Close = function(namespace, name)
		TriggerEvent("mmenu:status", false, namespace, name)
		SendNUIMessage({
			action    = "closeMenu",
			namespace = namespace,
			name      = name,
			data      = data
		})
	end
}

MenusManager.Opened				= {}

MenusManager.Open 				= function(namespace, name, data, submit, cancel, change, close)
	if MenusManager.IsAllowedToOpen and MenusManager.IsMenuPreventedFromOpening(namespace, name) == false then
		local menu 				= {}
		menu.isallowedtoclose 	= true
		menu.namespace 			= namespace
		menu.name      			= name
		menu.data      			= data
		menu.submit    			= submit
		menu.cancel    			= cancel
		menu.change    			= change

		menu.close 				= function()
			if MenusManager.IsAllowedToClose and menu.isallowedtoclose then
				MenusManager.NuiFunctions.Close(namespace, name)

				for i=1, #MenusManager.Opened, 1 do
					if MenusManager.Opened[i] ~= nil then
						if MenusManager.Opened[i].namespace == namespace and MenusManager.Opened[i].name == name then
							MenusManager.Opened[i] = nil
						end
					end
				end

				if close ~= nil then
					close()
				end
			end
		end

		menu.update 			= function(query, newData)
			for i=1, #menu.data.elements, 1 do
				local match = true

				for k,v in pairs(query) do
					if menu.data.elements[i][k] ~= v then
						match = false
					end
				end

				if match then
					for k,v in pairs(newData) do
						menu.data.elements[i][k] = v
					end
				end
			end
		end

		menu.refresh 			= function()
			MenusManager.NuiFunctions.Open(namespace, name, menu.data)
		end

		menu.setElement 		= function(i, key, val)
			menu.data.elements[i][key] = val
		end

		menu.setTitle 			= function(val)
			menu.data.title = val
		end

		menu.removeElement 		= function(query)
			for i=1, #menu.data.elements, 1 do
				for k,v in pairs(query) do
					if menu.data.elements[i] then
						if menu.data.elements[i][k] == v then
							table.remove(menu.data.elements, i)
							break
						end
					end
				end
			end
		end

		table.insert(MenusManager.Opened, menu)
		SpawnMainThread()
		MenusManager.NuiFunctions.Open(namespace, name, data)

		return menu
	else
		return nil
	end
end

MenusManager.Close 				= function(namespace, name)
	if MenusManager.IsAllowedToClose then
		for i=1, #MenusManager.Opened, 1 do
			if MenusManager.Opened[i] ~= nil then
				if MenusManager.Opened[i].namespace == namespace and MenusManager.Opened[i].name == name then
					MenusManager.Opened[i].close()
					MenusManager.Opened[i] = nil
				end
			end
		end
	end
end

MenusManager.CloseAll			= function()
	if MenusManager.IsAllowedToClose then
		for i=1, #MenusManager.Opened, 1 do
			if MenusManager.Opened[i] ~= nil then
				MenusManager.Opened[i].close()
				MenusManager.Opened[i] = nil
			end
		end
	end
end

MenusManager.GetMenu			= function(namespace, name)
	for i=1, #MenusManager.Opened, 1 do
		if MenusManager.Opened[i] ~= nil then
			if MenusManager.Opened[i].namespace == namespace and MenusManager.Opened[i].name == name then
				return MenusManager.Opened[i]
			end
		end
	end
	return nil
end

RegisterNUICallback("menu_submit", function(data, cb)
	local menu = MenusManager.GetMenu(data._namespace, data._name)

	if menu.submit ~= nil then
		menu.submit(data, menu)
	end

	cb("OK")
end)

RegisterNUICallback("menu_input", function(data, cb)
	if data.status == "open" then
		SetNuiFocus(true, false)
		MenusManager.NInputEnabled = true
	else
		SetNuiFocus(false, false)
		MenusManager.NInputEnabled = false
	end
	cb("OK")
end)

RegisterNUICallback("menu_cancel", function(data, cb)
	local menu = MenusManager.GetMenu(data._namespace, data._name)

	if menu.cancel ~= nil then
		menu.cancel(data, menu)
	end

	cb("OK")
end)

RegisterNUICallback("menu_change", function(data, cb)
	local menu = MenusManager.GetMenu(data._namespace, data._name)

	for i=1, #data.elements, 1 do
		menu.setElement(i, "value", data.elements[i].value)

		if data.elements[i].selected then
			menu.setElement(i, "selected", true)
		else
			menu.setElement(i, "selected", false)
		end
	end

	if menu.change ~= nil then
		menu.change(data, menu)
	end

	cb("OK")
end)

function SpawnMainThread()
	if not MenusManager.MainThreadStatus then
		MenusManager.MainThreadStatus = true
		Citizen.CreateThread(function()
			local GameTimer = GetGameTimer()
			local IsInputDisabled_2 = IsInputDisabled(0)
			local IsStillPressingAnyKey = false
			local StillPressingTimes = 0

			while #MenusManager.Opened > 0 do
				Citizen.Wait(0)
				GameTimer = GetGameTimer()
				IsInputDisabled_2 = IsInputDisabled(0)

				if IsInputDisabled_2 and (GameTimer - MenusManager.GuiTime) > MenusManager.GuiIndexChangeRate then
					if IsControlPressed(0, MenusManager.Keys["ENTER"]) and not IsControlPressed(0, MenusManager.Keys["LSHIFT"]) then
						SendNUIMessage({
							action  = "controlPressed",
							control = "ENTER"
						})
						MenusManager.GuiTime = GameTimer
						IsStillPressingAnyKey = true
					elseif IsDisabledControlPressed(0, MenusManager.Keys["ESC"]) then
						SendNUIMessage({
							action  = "controlPressed",
							control = "ESC"
						})
						MenusManager.GuiTime = GameTimer
						IsStillPressingAnyKey = true
					elseif IsControlPressed(0, MenusManager.Keys["ARROWUP"]) then
						SendNUIMessage({
							action  = "controlPressed",
							control = "ARROWUP"
						})
						MenusManager.GuiTime = GameTimer
						IsStillPressingAnyKey = true
					elseif IsControlPressed(0, MenusManager.Keys["ARROWDOWN"]) then
						SendNUIMessage({
							action  = "controlPressed",
							control = "ARROWDOWN"
						})
						MenusManager.GuiTime = GameTimer
						IsStillPressingAnyKey = true
					elseif IsControlPressed(0, MenusManager.Keys["ARROWLEFT"]) then
						SendNUIMessage({
							action  = "controlPressed",
							control = "ARROWLEFT"
						})
						MenusManager.GuiTime = GameTimer
						IsStillPressingAnyKey = true
					elseif IsControlPressed(0, MenusManager.Keys["ARROWRIGHT"]) then
						SendNUIMessage({
							action  = "controlPressed",
							control = "ARROWRIGHT"
						})
						MenusManager.GuiTime = GameTimer
						IsStillPressingAnyKey = true
					else
						IsStillPressingAnyKey = false
					end

					if IsStillPressingAnyKey then
						StillPressingTimes = StillPressingTimes + 2
						if StillPressingTimes > 2 then
                        	MenusManager.GuiIndexChangeRate = 150
						end
                    	if StillPressingTimes > 5 then
                        	MenusManager.GuiIndexChangeRate = 100
						end
						if StillPressingTimes > 25 then
							MenusManager.GuiIndexChangeRate = 50
						end
					else
						MenusManager.GuiIndexChangeRate = 150
						StillPressingTimes = 0
					end
				end

				if IsControlPressed(0, MenusManager.Keys["LSHIFT"]) and IsControlJustPressed(0, MenusManager.Keys["ENTER"]) and not MenusManager.NInputEnabled then
					SendNUIMessage({
						action  = "controlPressed",
						control = "NUMBERENTER"
					})
				end

				DisableControlAction(0, MenusManager.Keys["ESC"], true)
			end

			Citizen.CreateThread(function() -- to do not trigger game pause menu when exiting menus
				local __done = false
				SetTimeout(200, function() __done = true end)
				while not __done do
					DisableControlAction(0, MenusManager.Keys["ESC"], true)
					Citizen.Wait(0)
				end
			end)

			MenusManager.MainThreadStatus = false
		end)
	end
end

exports("Open", function(namespace, name, data, submit, cancel, change, close)
	return MenusManager.Open(namespace, name, data, submit, cancel, change, close)
end)

exports("Close", function(namespace, name)
	MenusManager.Close(namespace, name)
end)

exports("CloseAll", function()
	MenusManager.CloseAll()
end)

exports("GetMenu", function(namespace, name)
	return MenusManager.GetMenu(namespace, name)
end)

exports("IsOpen", function(namespace, name)
	return MenusManager.GetMenu(namespace, name) ~= nil
end)

exports("IsAnyMenuOpen", function()
	return #MenusManager.Opened > 0
end)

exports("GetAllOpenedMenus", function()
	return MenusManager.Opened
end)

exports("AllowMenusToOpen", function()
	MenusManager.IsAllowedToOpen = true
end)

exports("AllowMenusToClose", function()
	MenusManager.IsAllowedToClose = true
end)

exports("PreventMenusFromOpening", function()
	MenusManager.IsAllowedToOpen = false
end)

exports("PreventMenusFromClosing", function()
	MenusManager.IsAllowedToClose = false
end)

exports("AllowMenuToOpen", function(namespace, name)
	if PreventedFromOpening[namespace] ~= nil then
		PreventedFromOpening[namespace][name] = nil
	end
end)

exports("PreventMenuFromOpening", function(namespace, name)
	if PreventedFromOpening[namespace] == nil then
		PreventedFromOpening[namespace] = {}
	end
	PreventedFromOpening[namespace][name] = true
end)

exports("AllowMenuToClose", function(namespace, name)
	local menu = MenusManager.GetMenu(namespace, name)
	if menu ~= nil then
		menu.isallowedtoclose = true
	end
end)

exports("PreventMenuFromClosing", function(namespace, name)
	local menu = MenusManager.GetMenu(namespace, name)
	if menu ~= nil then
		menu.isallowedtoclose = false
	end
end)