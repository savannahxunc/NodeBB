'use strict';

// refacter to fix nested callbacks 4 deep
define('admin/appearance/skins', [
	'translator', 'alerts', 'settings', 'hooks', 'slugify',
], function (translator, alerts, settings, hooks, slugify) {
	const Skins = {};

	Skins.init = function () {
		// Populate skins from Bootswatch API
		$.ajax({
			method: 'get',
			url: 'https://bootswatch.com/api/5.json',
		}).done(handleBootswatchData);

		$('#save-custom-skins').on('click', handleSaveCustomSkins);
		$('#skins').on('click', handleSkinClick);
	};

	function handleBootswatchData(bsData) {
		hooks.on('action:settings.sorted-list.loaded', handleSettingsLoaded);
		settings.load('custom-skins', $('.custom-skin-settings'));
		Skins.render(bsData);
	}

	function handleSettingsLoaded(data) {
		if (data.hash === 'custom-skins') {
			slugifyThemes();
			highlightSelectedTheme(app.config.bootswatchSkin);
		}
	}

	function slugifyThemes() {
		$('.custom-skin-settings [data-type="list"] [data-theme]').each((i, el) => {
			const theme = $(el).attr('data-theme');
			$(el).attr('data-theme', slugify(theme));
		});
	}

	function handleSaveCustomSkins() {
		settings.save('custom-skins', $('.custom-skin-settings'), function () {
			alerts.success('[[admin/appearance/skins:save-custom-skins-success]]');
		});
		return false;
	}

	function handleSkinClick(e) {
		let target = $(e.target);
		if (!target.attr('data-action')) {
			target = target.parents('[data-action]');
		}
		const action = target.attr('data-action');
		if (action && action === 'use') {
			applySkin(target);
		}
	}

	function applySkin(target) {
		const parentEl = target.parents('[data-theme]');
		const cssSrc = parentEl.attr('data-css');
		const themeId = parentEl.attr('data-theme');
		const themeName = parentEl.attr('data-theme-name');

		socket.emit('admin.themes.set', {
			type: 'bootswatch',
			id: themeId,
			src: cssSrc,
		}, function (err) {
			if (err) {
				return alerts.error(err);
			}
			highlightSelectedTheme(themeId);

			alerts.alert({
				alert_id: 'admin:theme',
				type: 'info',
				title: '[[admin/appearance/skins:skin-updated]]',
				message: themeId ? ('[[admin/appearance/skins:applied-success, ' + themeName + ']]') : '[[admin/appearance/skins:revert-success]]',
				timeout: 5000,
			});
		});
	}

	Skins.render = function (bootswatch) {
		const themeContainer = $('#bootstrap_themes');
		app.parseAndTranslate('admin/partials/theme_list', {
			themes: bootswatch.themes.map(mapThemes),
			showRevert: true,
		}, function (html) {
			themeContainer.html(html);
			highlightSelectedTheme(app.config.bootswatchSkin);
		});
	};

	function mapThemes(theme) {
		return {
			type: 'bootswatch',
			id: theme.name.toLowerCase(),
			name: theme.name,
			description: theme.description,
			screenshot_url: theme.thumbnail,
			url: theme.preview,
			css: theme.cssCdn,
			skin: true,
		};
	}

	function highlightSelectedTheme(themeId) {
		translator.translate('[[admin/appearance/skins:select-skin]]  ||  [[admin/appearance/skins:current-skin]]', function (text) {
			const [select, current] = text.split('  ||  ');
			resetThemeSelection(select);
			if (themeId) {
				setActiveTheme(themeId, current);
			}
		});
	}

	function resetThemeSelection(select) {
		$('[data-theme]').removeClass('selected')
			.find('[data-action="use"]').each(function () {
				const theme = $(this).parents('[data-theme]').attr('data-theme');
				if (theme) {
					$(this).html(select).removeClass('btn-success').addClass('btn-primary');
				}
			});
	}

	function setActiveTheme(themeId, current) {
		$(`[data-theme="${themeId}"]`).addClass('selected')
			.find('[data-action="use"]').html(current)
			.removeClass('btn-primary')
			.addClass('btn-success');
	}
	return Skins;
});
