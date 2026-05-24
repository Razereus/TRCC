// ==UserScript==
// @name         Torn Racing Class Cosmetics v1.0
// @namespace    https://github.com/Razereus/TRCC
// @version      1.0
// @description  Changes Torn City race class banner. Forces placement in Generic Container. Developed by RAZ.
// @author       RAZ
// @copyright    2026, RAZ (Razereus)
// @license      GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0.txt
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @homepageURL  https://github.com/Razereus/TRCC
// @supportURL   https://github.com/Razereus/TRCC/issues
// @downloadURL https://raw.githubusercontent.com/Razereus/TRCC/main/TRCCv1.0.js
// @updateURL   https://raw.githubusercontent.com/Razereus/TRCC/main/TRCCv1.0.js
// @run-at       document-end
// @match        https://www.torn.com/page.php?sid=racing*
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('[RacingCosmetics v12.3] Script Starting...');

    const raceClasses = ['A', 'B', 'C', 'D', 'E'];
    // --- Configuration & State ---
    let selectedBanner = "A";

    // Load Settings
    if (typeof GM_getValue !== 'undefined') {
        try {
            selectedBanner = GM_getValue("BR_CRB_BANNER", "A");
        } catch (e) {
            console.error('[RacingCosmetics] Error reading saved banner:', e);
        }
    } else {
        console.warn('[RacingCosmetics] GM_getValue not found. Running in fallback mode.');
    }

    let $mainWrap = null;
    let $dropdownContainer = null;
    let $buttonWrapper = null;
    let observer = null;

    // CSS for the button and dropdown
    function injectDropdownStyles() {
        const styles = `
            #razereus-dropdown-wrapper {
                display: inline-block !important;
                margin-right: 8px !important;
                position: relative;
                font-family: 'Arial', sans-serif;
                z-index: 100000;
                vertical-align: middle;
            }
            #razereus-dropdown-btn {
                background: transparent !important;
                color: #fff !important;
                border: none !important;
                padding: 0 !important;
                cursor: pointer;
                font-size: 13px !important;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: opacity 0.2s;
                line-height: 1;
                font-weight: bold;
            }
            #razereus-dropdown-btn:hover { opacity: 0.8; }
            #razereus-dropdown-list {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                background: #222;
                border: 1px solid #555;
                border-radius: 4px;
                min-width: 120px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.6);
                list-style: none;
                padding: 5px 0;
                margin: 0;
                z-index: 100001;
            }
            #razereus-dropdown-list li {
                padding: 8px 12px;
                color: #ddd;
                cursor: pointer;
                font-size: 13px;
                border-bottom: 1px solid #333;
                transition: background 0.2s;
            }
            #razereus-dropdown-list li:last-child { border-bottom: none; }
            #razereus-dropdown-list li:hover { background: #444; color: #fff; }
            #razereus-dropdown-list li.active { font-weight: bold; color: #44ff88; background: #2a2a2a; }
        `;

        if (typeof GM_addStyle !== 'undefined') {
            GM_addStyle(styles);
        } else {
            const style = document.createElement('style');
            style.textContent = styles;
            document.head.appendChild(style);
        }
    }

    function findMainContainer() {
        return $('.racing-main-wrap');
    }

    function changeBanner(raceClass) {
        if (!$mainWrap || $mainWrap.length === 0) {
            console.log('[RacingCosmetics] Main container not found.');
            return;
        }

        raceClasses.forEach(cls => $mainWrap.removeClass('class-' + cls));
        $mainWrap.addClass('class-' + raceClass);
        if (typeof GM_setValue !== 'undefined') {
            GM_setValue("BR_CRB_BANNER", raceClass);
        }
        void $mainWrap.offsetWidth;
        updateDropdownUI(raceClass);
        console.log(`[RacingCosmetics] Banner changed to Class ${raceClass}`);
    }

    function updateDropdownUI(activeClass) {
        if (!$dropdownContainer) return;
        $dropdownContainer.find('li').removeClass('active');
        $dropdownContainer.find(`li[data-val="${activeClass}"]`).addClass('active');
        const $btn = $dropdownContainer.parent().find('#razereus-dropdown-btn');
        if ($btn.length) {
            $btn.html(`${activeClass} <span style="font-size:9px; margin-left:2px">▼</span>`);
        }
    }

    function createButton() {
        if ($('#razereus-dropdown-wrapper').length > 0) {
            return $('#razereus-dropdown-wrapper');
        }

        $dropdownContainer = $(`<ul id="razereus-dropdown-list"></ul>`);
        // Add Class Options
        raceClasses.forEach(cls => {
            const isActive = cls === selectedBanner;
            const $li = $(`<li data-val="${cls}" class="${isActive ? 'active' : ''}">Class ${cls}</li>`);
            $li.on('click', function(e) {
                e.stopPropagation();
                changeBanner(cls);
                toggleDropdown(false);
            });
            $dropdownContainer.append($li);
        });

        const $wrapper = $(`<div id="razereus-dropdown-wrapper"></div>`);
        const $btn = $(`<button id="razereus-dropdown-btn">${selectedBanner} <span>▼</span></button>`);

        $btn.on('click', function(e) {
            e.stopPropagation();
            toggleDropdown();
        });

        $(document).on('click', function() {
            toggleDropdown(false);
        });

        $wrapper.append($btn).append($dropdownContainer);
        console.log('[RacingCosmetics] Button created.');
        return $wrapper;
    }

    function placeButton($wrapper) {
        console.log('[RacingCosmetics] Attempting placement (Generic Container)...');
        const $root = $('#racing-leaderboard-header-root');
        if ($root.length === 0) {
            console.log('[RacingCosmetics] Root container not found.');
            return false;
        }

        // 1. PRIMARY: Target Generic Container
        const $generic = $root.find('.linksContainer____MclN');
        if ($generic.length > 0) {
            try {
                $generic.prepend($wrapper);
                console.log('[RacingCosmetics] SUCCESS: Placed in Generic Container.');
                return true;
            } catch (err) {
                console.error('[RacingCosmetics] Generic Placement Error:', err);
            }
        }

        // 2. FALLBACK: Target "City" link (If generic container is missing)
        console.log('[RacingCosmetics] Generic container not found. Trying "City" link fallback...');
        const $cityLink = $root.find('*').filter(function() {
            const text = $(this).text().trim();
            if (text === 'City') return true;
            return $(this).find('*').filter(function() {
                return $(this).text().trim() === 'City';
            }).length > 0;
        }).first();

        if ($cityLink.length > 0) {
            try {
                $cityLink.before($wrapper);
                console.log('[RacingCosmetics] SUCCESS: Placed before "City" (Fallback).');
                return true;
            } catch (err) {
                console.error('[RacingCosmetics] City Link Fallback Error:', err);
            }
        }

        console.warn('[RacingCosmetics] Could not find target for button placement.');
        return false;
    }

    function ensureButtonExists() {
        if ($('#razereus-dropdown-wrapper').length === 0) {
            console.log('[RacingCosmetics] Button missing! Creating...');
            $buttonWrapper = createButton();
            if ($buttonWrapper) {
                placeButton($buttonWrapper);
            }
        } else {
            console.log('[RacingCosmetics] Button exists. Re-attaching events...');
            const $btn = $('#razereus-dropdown-btn');
            const $list = $('#razereus-dropdown-list');
            $btn.off('click');
            $list.find('li').off('click');
            $(document).off('click');

            $btn.on('click', function(e) {
                e.stopPropagation();
                toggleDropdown();
            });

            $list.find('li').each(function() {
                const $li = $(this);
                const val = $li.data('val');

                if (val) {
                    $li.on('click', function(e) {
                        e.stopPropagation();
                        changeBanner(val);
                        toggleDropdown(false);
                    });
                }
            });

            $(document).on('click', function() {
                toggleDropdown(false);
            });
        }
    }

    function init() {
        if (typeof jQuery === 'undefined') {
            console.warn('[RacingCosmetics] jQuery not found. Retrying...');
            setTimeout(init, 200);
            return;
        }

        console.log('[RacingCosmetics] Initialization started.');
        injectDropdownStyles();
        $mainWrap = findMainContainer();
        if ($mainWrap.length > 0) {
            changeBanner(selectedBanner);
        }

        const root = document.querySelector('#racing-leaderboard-header-root');
        if (root) {
            if (observer) observer.disconnect();
            observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                        console.log('[RacingCosmetics] DOM content changed (Tab Switch detected).');
                        ensureButtonExists();
                    }
                });
            });
            observer.observe(root, { childList: true, subtree: true });
            console.log('[RacingCosmetics] MutationObserver active.');
        }

        ensureButtonExists();
    }

    function toggleDropdown(forceState) {
        const $list = $('#razereus-dropdown-list');
        if (!$list.length) return;
        const isVisible = $list.css('display') === 'block';
        if (typeof forceState === 'boolean') {
            $list.css('display', forceState ? 'block' : 'none');
        } else {
            $list.css('display', isVisible ? 'none' : 'block');
        }
    }

    init();
})();
