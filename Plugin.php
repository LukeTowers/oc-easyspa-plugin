<?php namespace LukeTowers\EasySPA;

use System\Classes\PluginBase;

/**
 * EasySPA Plugin Information File
 */
class Plugin extends PluginBase
{
    /**
     * Returns information about this plugin.
     *
     * @return array
     */
    public function pluginDetails()
    {
        return [
            'name'        => 'luketowers.easyspa::lang.plugin.name',
            'description' => 'luketowers.easyspa::lang.plugin.description',
            'author'      => 'Luke Towers',
            'icon'        => 'icon-code',
            'homepage'    => 'https://github.com/LukeTowers/oc-easyspa-plugin',
        ];
    }

    /**
     * Registers any front-end components implemented in this plugin.
     *
     * @return array
     */
    public function registerComponents()
    {
        return [
            'LukeTowers\EasySPA\Components\EasySPA' => 'easySPA',
        ];
    }
}
