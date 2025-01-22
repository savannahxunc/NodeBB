'use strict';

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
	};

	function handleBootswatchData(bsData) {
		// Delegate further actions
		hooks.on('action:settings.sorted-list.loaded', onSettingsLoaded);
		settings.load('custom-skins', $('.custom-skin-settings'));
		Skins.render(bsData);
	}

	function onSettingsLoaded(data) {
		if (data.hash === 'custom-skins') {
			updateThemeData();
			highlightSelectedTheme(app.config.bootswatchSkin);
		}
	}

	function updateThemeData() {
		$('.custom-skin-settings [data-type="list"] [data-theme]').each((i, el) => {
			$(el).attr('data-theme', slugify($(el).attr('data-theme')));
		});
	}

	function highlightSelectedTheme(themeId) {
		translator.translate('[[admin/appearance/skins:select-skin]]  ||  [[admin/appearance/skins:current-skin]]', function (text) {
			text = text.split('  ||  ');
			const select = text[0];
			const current = text[1];

			$('[data-theme]')
				.removeClass('selected')
				.find('[data-action="use"]').each(function () {
					if ($(this).parents('[data-theme]').attr('data-theme')) {
						$(this)
							.html(select)
							.removeClass('btn-success')
							.addClass('btn-primary');
					}
				});

			if (themeId) {
				$('[data-theme="' + themeId + '"]')
					.addClass('selected')
					.find('[data-action="use"]')
					.html(current)
					.removeClass('btn-primary')
					.addClass('btn-success');
			}
		});
	}

	return Skins;
});
