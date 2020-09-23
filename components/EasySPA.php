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
    
    public function defineProperties()
    {
        return [
            'wrapper_id' => [
                'title'       => 'luketowers.easyspa::lang.components.easyspa.wrapper_id',
                'type'        => 'string',
                'default'     => 'easyspa-container',
            ]
        ];
    }
    
    public function onRun()
    {
        // Do required initial work only if this isn't a request to load a page
        if (Request::header('X_OCTOBER_REQUEST_HANDLER') !== 'onGetPage') {
            $this->assetPath = plugins_path('luketowers/easyspa/assets');
            $this->addJs(['js/statemanager.js', 'js/assetmanager.js', 'js/easyspa.js']);

            $this->controller->bindEvent('page.render', function ($contents) {
                return $contents;
            });
        }
    }

    /**
     * Handle an AJAX request for a page
     *
     * @return array
     */
    public function onGetPage()
    {
        $request = request();
        // Remove the AJAX handler from the request to prevent an infinite loop
        $request->headers->remove('X_OCTOBER_REQUEST_HANDLER');
        $request->headers->remove('X-Requested-With');

        // Run the current page to collect information for comparisons
        $this->controller->run(null);

        // Get the layout of the source page (can be empty)
        $originalLayout = @$this->controller->getPage()->settings['layout'];

        // Get the current page's assets
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
            $this->server->set('UNENCODED_URL', $url);
            $this->server->set('REQUEST_URI', $url);
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

        // Render the full page result
        $fullResult = $this->controller->run($url)->content();

        // Get the layout of the target page
        $newLayout = @$this->controller->getPage()->settings['layout'];

        // Render just the page contents if the source and target pages use the same layouts
        $pageContents = false;
        if ($newLayout === $originalLayout) {
            $pageContents = $this->controller->renderPage();
        }

        $result = [
            'X_EASYSPA_RENDERED_TITLE' => $this->getHtmlTitle($fullResult),
        ];
        if ($pageContents) {
            // Render the partials to be updated
            $partials = [];
            if (!empty(input('refreshPartials'))) {
                $refreshPartials = explode('&', input('refreshPartials'));
                foreach ($refreshPartials as $partial) {
                    list($partialPath, $selector) = explode(':', $partial);
                    $partials[$selector] = $this->controller->renderPartial($partialPath);
                }
            }

            $result = array_merge($result, $partials, [
                '#' . $this->property('wrapper_id') => $pageContents,
                'X_EASYSPA_CHANGED_ASSETS' => json_encode($this->getChangedAssets($currentAssets, $this->controller->getAssetPaths())),
            ]);
        } else {
            $result['X_EASYSPA_RENDERED_CONTENTS'] = $fullResult;
        }

        return $result;
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

    /**
     * Get an HTML document's title using regex
     *
     * @param string $html The HTML to attempt to parse
     * @return string $title The retrieved title if found, false if none found
     */
    protected function getHtmlTitle($html)
    {
        $title = false;

        $matches = [];
        if (preg_match('/<.*title.*>(.*?)<\/title>/', $html, $matches)) {
            $title = trim($matches[1]);
        }

        return $title;
    }
}
