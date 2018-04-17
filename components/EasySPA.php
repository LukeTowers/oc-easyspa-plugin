<?php namespace LukeTowers\EasySPA\Components;

use Request;
use Cms\Classes\ComponentBase;

class EasySPA extends ComponentBase
{
    public function componentDetails()
    {
        return [
            'name'        => 'luketowers.easyspa::lang.components.easyspa.name',
            'description' => 'luketowers.easyspa::lang.components.easyspa.description',
        ];
    }

    public function onRun()
    {
        // Do required initial work only if this isn't a request to load a page
        if (Request::header('X_OCTOBER_REQUEST_HANDLER') !== 'onGetPage') {
            $this->addJs('/plugins/luketowers/easyspa/assets/js/easyspa.js');

            $this->controller->bindEvent('page.render', function ($contents) {
                return '<div id="easyspa-container">' . $contents . '</div>';
            });
        }
    }

    public function onGetPage()
    {
        // Remove the AJAX handler from the request to prevent an infinite loop
        request()->headers->remove('X_OCTOBER_REQUEST_HANDLER');
        request()->headers->remove('X-Requested-With');

        // Render the requested page
        $url = $this->getRelativeUrl(input('url'));
        $this->controller->run($url, true);
        $pageContents = $this->controller->renderPage();

        // Render the partials to be updated
        $partials = [];
        if (!empty(input('refreshPartials'))) {
            $refreshPartials = explode(',', input('refreshPartials'));
            foreach ($refreshPartials as $partial) {
                list($partialPath, $selector) = explode(':', $partial);
                $partials[$selector] = $this->controller->renderPartial($partialPath);
            }
        }

        // Return the contents
        return array_merge($partials, ['#easyspa-container' => $pageContents]);
    }

    function getRelativeUrl($url) {
        $parts = parse_url($url);
        $query = !empty($parts['query']) ? '?' . $parts['query'] : '';

        return $parts['path'] . $query;
    }
}
