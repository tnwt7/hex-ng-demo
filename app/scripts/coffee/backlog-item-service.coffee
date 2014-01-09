angular.module('ngArchitectApp')
  .factory('BacklogItemsService', () ->
    items = [
      {
        'title': 'HTML5 Boilerplate',
        'content': 'HTML5 Boilerplate is a professional front-end template for building fast, robust, and adaptable web apps or sites.'
      },
      {
        'title': 'Angular',
        'content': 'AngularJS is a toolset for building the framework most suited to your application development.'
      },
      {
        'title': 'Karma',
        'content': 'Spectacular Test Runner for JavaScript.'
      }
    ]
    service =
      'loadBacklogItems': () -> items
    return service
  )
