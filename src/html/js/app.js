let inputEnabled = false;
(function(){
	const MenuTpl =
	'<div id="menu_{{_namespace}}_{{_name}}" class="menu{{#align}} align-{{align}}{{/align}}">' +
		'<div class="head"><span>{{{title}}}</span></div>' +
			'<div class="menu-items">' + 
				'{{#elements}}' +
					'<div class="menu-item {{#selected}}selected{{/selected}}">' +
						'{{{label}}}{{#isSlider}} : &lt;{{{sliderLabel}}}&gt;{{/isSlider}}' +
					'</div>' +
				'{{/elements}}' +
			'</div>'+
		'</div>' +
	'</div>';
	
	window.Menu       	= {};
	Menu.ResourceName 	= 'mmenu';
	Menu.Protocol		= "https://";
	Menu.Opened       	= {};
	Menu.Pos          	= {};
	Menu.Focus        	= [];

	Menu.Open = function(namespace, name, data) {
		if (typeof Menu.Opened[namespace] == 'undefined') {
			Menu.Opened[namespace] = {};
		}

		if (typeof Menu.Opened[namespace][name] != 'undefined') {
			Menu.Close(namespace, name);
		}

		if (typeof Menu.Pos[namespace] == 'undefined') {
			Menu.Pos[namespace] = {};
		}

		for (let i = 0; i < data.elements.length; i++) {
			if (typeof data.elements[i].type == 'undefined') {
				data.elements[i].type = 'default';
			}
		}

		data._index     = Menu.Focus.length;
		data._namespace = namespace;
		data._name      = name;

		for (let i=0; i<data.elements.length; i++) {
			data.elements[i]._namespace = namespace;
			data.elements[i]._name      = name;
		}

		Menu.Opened[namespace][name] = data;
		Menu.Pos   [namespace][name] = 0;

		for (let i = 0; i < data.elements.length; i++) {
			if (data.elements[i].selected) {
				Menu.Pos[namespace][name] = i;
			} else {
				data.elements[i].selected = false;
			}
		}

		Menu.Focus.push({
			namespace: namespace,
			name     : name
		});
		
		Menu.Render();
		$('#menu_' + namespace + '_' + name).find('.menu-item.selected')[0].scrollIntoView();
	};

	Menu.Close = function(namespace, name) {
		delete Menu.Opened[namespace][name];

		for (let i = 0; i < Menu.Focus.length; i++) {
			if (Menu.Focus[i].namespace == namespace && Menu.Focus[i].name == name) {
				Menu.Focus.splice(i, 1);
				break;
			}
		}

		Menu.Render();
	};

	Menu.Render = function() {
		let menuContainer       = document.getElementById('menus');
		let focused             = Menu.GetFocused();
		menuContainer.innerHTML = '';

		$(menuContainer).hide();

		for (let namespace in Menu.Opened) {
			for (let name in Menu.Opened[namespace]) {

				let menuData = Menu.Opened[namespace][name];
				let view     = JSON.parse(JSON.stringify(menuData));

				for (let i=0; i<menuData.elements.length; i++) {
					let element = view.elements[i];

					switch (element.type) {
						case 'default' : break;

						case 'slider' : {
							element.isSlider    = true;
							element.sliderLabel = (typeof element.options == 'undefined') ? element.value : element.options[element.value];
							break;
						}
						default : break;
					}

					if (i == Menu.Pos[namespace][name]) {
						element.selected = true;
					}
				}

				let menu = $(Mustache.render(MenuTpl, view))[0];
				$(menu).hide();
				menuContainer.appendChild(menu);
			}
		}

		if (typeof focused != 'undefined') {
			$('#menu_' + focused.namespace + '_' + focused.name).show();
		}

		$(menuContainer).show();
	};

	Menu.Submit = function(namespace, name, data) {
		PostReq(`${Menu.Protocol}${Menu.ResourceName}/menu_submit`, {
			_namespace: namespace,
			_name     : name,
			current   : data,
			elements  : Menu.Opened[namespace][name].elements
		});
	};

	Menu.Cancel = function(namespace, name) {
		PostReq(`${Menu.Protocol}${Menu.ResourceName}/menu_cancel`, {
			_namespace: namespace,
			_name     : name
		});
	};

	Menu.Change = function(namespace, name, data) {
		PostReq(`${Menu.Protocol}${Menu.ResourceName}/menu_change`, {
			_namespace: namespace,
			_name     : name,
			current   : data,
			elements  : Menu.Opened[namespace][name].elements
		});
	};

	Menu.GetFocused = function() {
		return Menu.Focus[Menu.Focus.length - 1];
	};

	window.onData = (data) => {
		switch (data.action) {
			case 'openMenu': {
				Menu.Open(data.namespace, data.name, data.data);
				break;
			}
			case 'closeMenu': {
				Menu.Close(data.namespace, data.name);
				break;
			}
			case 'controlPressed': {
				switch (data.control) {	
					case 'ENTER': {
						let focused = Menu.GetFocused();
						if (typeof focused != 'undefined') {
							let menu    = Menu.Opened[focused.namespace][focused.name];
							let Pos     = Menu.Pos[focused.namespace][focused.name];
							let elem    = menu.elements[Pos];

							if (menu.elements.length > 0) {
								Menu.Submit(focused.namespace, focused.name, elem);	
							}
						}
						break;
					}
					case 'ESC': {
						let focused = Menu.GetFocused();
						if (typeof focused != 'undefined') {
							Menu.Cancel(focused.namespace, focused.name);
						}
						break;
					}
					case 'ARROWUP': {
						let focused = Menu.GetFocused();
						if (typeof focused != 'undefined') {
							let menu = Menu.Opened[focused.namespace][focused.name];
							let Pos  = Menu.Pos[focused.namespace][focused.name];
							if (Pos > 0) {
								Menu.Pos[focused.namespace][focused.name]--;
							} else {
								Menu.Pos[focused.namespace][focused.name] = menu.elements.length - 1;
							}
							let elem = menu.elements[Menu.Pos[focused.namespace][focused.name]];
							for (let i = 0; i < menu.elements.length; i++) {
								if (i == Menu.Pos[focused.namespace][focused.name]) {
									menu.elements[i].selected = true;
								} else {
									menu.elements[i].selected = false;
								}
							}
							Menu.Change(focused.namespace, focused.name, elem);
							Menu.Render();
							inputEnabled = false;
							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}
						break;
					}
					case 'ARROWDOWN' : {
						let focused = Menu.GetFocused();
						if (typeof focused != 'undefined') {
							let menu   = Menu.Opened[focused.namespace][focused.name];
							let Pos    = Menu.Pos[focused.namespace][focused.name];
							let length = menu.elements.length;
							if (Pos < length - 1) {
								Menu.Pos[focused.namespace][focused.name]++;
							} else {
								Menu.Pos[focused.namespace][focused.name] = 0;
							}
							let elem = menu.elements[Menu.Pos[focused.namespace][focused.name]];
							for (let i=0; i<menu.elements.length; i++) {
								if (i == Menu.Pos[focused.namespace][focused.name]) {
									menu.elements[i].selected = true;
								} else {
									menu.elements[i].selected = false;
								}
							}
							Menu.Change(focused.namespace, focused.name, elem);
							Menu.Render();
							inputEnabled = false;
							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}
						break;
					}
					case 'ARROWLEFT' : {
						let focused = Menu.GetFocused();
						if (typeof focused != 'undefined') {
							let menu = Menu.Opened[focused.namespace][focused.name];
							let Pos  = Menu.Pos[focused.namespace][focused.name];
							let elem = menu.elements[Pos];
							switch(elem.type) {
								case 'default': break;
								case 'slider': {
									let min = (typeof elem.min == 'undefined') ? 0 : elem.min;
									let max = (typeof elem.max == 'undefined') ? 0 : elem.max;

									if (elem.value > min) {
										elem.value--;
									} 
									else if (elem.options == null) {
										elem.value = max;
									} else {
										elem.value = elem.options.length-1;
									}
									Menu.Change(focused.namespace, focused.name, elem);
									Menu.Render();
									break;
								}
								default: break;
							}
							inputEnabled = false;
							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}
						break;
					}
					case 'ARROWRIGHT' : {
						let focused = Menu.GetFocused();		
						if (typeof focused != 'undefined') {
							let menu = Menu.Opened[focused.namespace][focused.name];
							let Pos  = Menu.Pos[focused.namespace][focused.name];
							let elem = menu.elements[Pos];
							switch(elem.type) {
								case 'default': break;
								case 'slider': {
									if (elem.options == null) {
										let min = (typeof elem.min == 'undefined') ? 0 : elem.min;
										if (typeof elem.max != 'undefined' && elem.value < elem.max) {
											elem.value++;
											Menu.Change(focused.namespace, focused.name, elem);
										} 
										else if (elem.options == null) {
											elem.value = min
											Menu.Change(focused.namespace, focused.name, elem);
										}
									} else {
										if (typeof elem.options != 'undefined' && elem.value < elem.options.length - 1) {
											elem.value++;
											Menu.Change(focused.namespace, focused.name, elem);						
										} else {
											elem.value = 0
											Menu.Change(focused.namespace, focused.name, elem);		
										}
									}

									inputEnabled = false;
									Menu.Render();
									break;
								}
								default: break;
							}
							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}
					}
					case 'NUMBERENTER' : {
						
						let focused = Menu.GetFocused();
						if (typeof focused != 'undefined' && data.control == "NUMBERENTER" && inputEnabled === false) {
							let menu = Menu.Opened[focused.namespace][focused.name];
							let Pos  = Menu.Pos[focused.namespace][focused.name];
							let elem = menu.elements[Pos];
							switch(elem.type) {
								case 'default': break;
								case 'slider': {
									inputEnabled = true;
									PostReq(`${Menu.Protocol}${Menu.ResourceName}/menu_input`, { status: "open" });
									let el = document.querySelector(".menu-item.selected"); 
									let html = el.innerHTML.replace(/[0-9]/g, "").replace("&lt;", "").replace("&gt;", "");
									$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected').html(`${html}<input min='${elem.min}' max='${elem.max}' type='number' class='input-css' style='border: 0px; background: none;'>`);
									let input_num = $('input');
									input_num.focus();
									input_num.val(elem.value);
									input_num.select();
									data.control = "none";
									break;
								}
								default: break;
							}
						}
						break;
					}
					default : break;
				}
				break;
			}
		}
	};

	window.onload = function(e){
		window.addEventListener('message', (event) => {
			onData(event.data);
		});
	};

	$(document).ready(function(){
		window.addEventListener("keypress", KeyPressEventHandler, false);
	});

	function KeyPressEventHandler(e) {
		let keyCode = e.keyCode;
		if(keyCode == 13 && inputEnabled === true) {
			inputEnabled = false;
			let num = Number($('input').val());
			
			let focused = Menu.GetFocused();
			if (typeof focused != 'undefined') {
				
				let menu = Menu.Opened[focused.namespace][focused.name];
				let Pos  = Menu.Pos[focused.namespace][focused.name];
				let elem = menu.elements[Pos];

				switch(elem.type) {
					case 'default': break;

					case 'slider': {
						if (typeof elem.options != 'undefined' && num < elem.options.length - 1) {
							elem.value = num;
							Menu.Change(focused.namespace, focused.name, elem);		
						}

						let min = (typeof elem.min == 'undefined') ? 0 : elem.min;

						if (typeof elem.max != 'undefined' && num <= elem.max && num >= min) {
							elem.value = num;
							Menu.Change(focused.namespace, focused.name, elem);
						}
						
						PostReq(`${Menu.Protocol}${Menu.ResourceName}/menu_input`, { status: "notopen" });
						
						Menu.Render();
						break;
					}

					default: break;
				}

				$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
			}
		}
	};
})();

function PostReq(url, data) {
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify(data));
}