# About

Adds Single Page Application like features to the OctoberCMS frontend using the OctoberCMS AJAX framework. More specifically, it enables (through the adding of a component to your layout) loading and updating page content through AJAX.

# Requirements

This plugin requires the [Ajax Framework](https://octobercms.com/docs/cms/ajax) to be included in your layout/page in order to handle requests.

# Current Support

Only loading new pages (Static Pages or CMS Pages, any URL that is controlled by the CMS) is currently supported. Components on dynamically loaded pages will also work, and assets will be dynamically added and removed as required.

# Installation

To install from the [Marketplace](https://octobercms.com/plugin/luketowers-easyspa), click on the "Add to Project" button and then select the project you wish to add it to before updating the project to pull in the plugin.

To install from the backend, go to **Settings -> Updates & Plugins -> Install Plugins** and then search for `LukeTowers.EasySPA`.

To install from [the repository](https://github.com/luketowers/oc-easyspa-plugin), clone it into **plugins/luketowers/easyspa** and then run `composer update` from your project root in order to pull in the dependencies.

To install it with Composer, run `composer require luketowers/oc-easyspa-plugin` from your project root.

# Usage

To use this plugin, simply attach the `[easySPA]` component to any layouts that you want to be able to have their pages loaded over AJAX. The loader needs to be attached to an element on the page that contains anchor tags with the URLs to the pages that are to be loaded. This is done by adding the `data-controler="easy-spa-loader"` attribute onto the containing element. There is also an optional attribute `data-refresh-partials` that can be used to define additional partials that should be refreshed when the page is load in the form of `partialPath1:#partialSelector1` with additional partials appended with an `&` symbol.

Example Layout:

```
description="Default layout"
[easySPA]
==
<html>
    <head>
        ...
    </head>
    <body data-control="easy-spa-loader" data-refresh-partials="site/header:#site-header">
        <header id="site-header">
            {% partial 'site/header' %}
        </header>

        {% page %}

        <footer>
            ...
        </footer>
    </body>
</html>
```
