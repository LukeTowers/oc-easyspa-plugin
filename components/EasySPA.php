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

    public function init()
    {
        // dd($this);
        // \App::extend(LaravelRequest::class, function ($request, $app) {
        //     return new Request;
        // });
    }

    public function onRun()
    {
        // Do required initial work only if this isn't a request to load a page
        if (Request::header('X_OCTOBER_REQUEST_HANDLER') !== 'onGetPage') {
            $this->assetPath = plugins_path('luketowers/easyspa/assets');
            $this->addJs(['js/assetmanager.js', 'js/easyspa.js']);

            $this->controller->bindEvent('page.render', function ($contents) {
                return '<div id="easyspa-container">' . $contents . '</div>';
            });
        }
    }

    public function onGetPage()
    {
        $request = request();
        // Remove the AJAX handler from the request to prevent an infinite loop
        $request->headers->remove('X_OCTOBER_REQUEST_HANDLER');
        $request->headers->remove('X-Requested-With');

        // Get the current page's assets
        $this->controller->run(null);
        $currentAssets = $this->controller->getAssetPaths();
        $this->controller->flushAssets();
        // Ignore the issues that may exist on the current page
        $this->controller->setStatusCode(200);

        // Render the requested page
        $url = $this->getRelativeUrl(input('url'));

        // This is ridiculous... All this to simply reset the Request::path() call
        // for the StaticMenu component to have the correct active menu item by
        // setting the request url midway through the request to the page requested
        // over AJAX
        $setRequestUrl = \Closure::bind(function ($url) {
            $this->requestUri = null;
            $this->pathInfo = null;
            $this->headers->set('X_ORIGINAL_URL', $url);
        }, $request, $request);
        $setRequestUrl($url);

        // Reflection API approach to above
        // $reflectionClass = new \ReflectionClass(get_class($request));
        // $propertiesToNull = [
        //     $reflectionClass->getProperty('requestUri'),
        //     $reflectionClass->getProperty('pathInfo'),
        // ];
        // foreach ($propertiesToNull as $property) {
        //     $property->setAccessible(true);
        //     $property->setValue(request(), null);
        // }
        // $request->headers->set('X_ORIGINAL_URL', $url);

        $this->controller->run($url);
        $pageContents = $this->controller->renderPage();

        // Render the partials to be updated
        $partials = [];
        if (!empty(input('refreshPartials'))) {
            $refreshPartials = explode('&', input('refreshPartials'));
            foreach ($refreshPartials as $partial) {
                list($partialPath, $selector) = explode(':', $partial);
                $partials[$selector] = $this->controller->renderPartial($partialPath);
            }
        }

        // Return the contents
        return array_merge($partials, [
            '#easyspa-container' => $pageContents,
            'X_EASYSPA_CHANGED_ASSETS' => json_encode($this->getChangedAssets($currentAssets, $this->controller->getAssetPaths())),
        ]);
    }

    /**
     * Get the assets to be changed
     *
     * @param array $currentAssets The current page's assets
     * @param array $newAssets The requested page's assets
     * @return array The assets to be changed in the form of ['add' => [], 'remove' => []]
     */
    protected function getChangedAssets($currentAssets, $newAssets)
    {
        $changedAssets = [
            'add' => [],
            'remove' => [],
        ];
        $types = ['css', 'js'];

        foreach ($types as $type) {
            $changedAssets['add'][$type]    = array_diff($newAssets[$type], $currentAssets[$type]);
            $changedAssets['remove'][$type] = array_diff($currentAssets[$type], $newAssets[$type]);
        }

        return $changedAssets;
    }

    /**
     * Get the relative URL from the provided absolute URL
     *
     * @param string $url The absolute URL to convert
     * @return string The relative URL
     */
    protected function getRelativeUrl($url) {
        $parts = parse_url($url);
        $path = !empty($parts['path']) ? $parts['path'] : '/';
        $query = !empty($parts['query']) ? '?' . $parts['query'] : '';

        return $path . $query;
    }
}
