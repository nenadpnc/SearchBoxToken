(function(){
    var categoryList = [
        {
            name: 'in',
            url: 'data/places.json'
        },
        {
            name: 'landform',
            url: 'data/landform.json'
        },
        {
            name: 'temperature',
            url: 'data/temperature.json'
        },
        {
            name: 'where I can',
            url: 'data/todo.json',
            multiple: true
        },
        {
            name: 'related to',
            url: 'data/related.json'
        }
    ];
    
    var examples = [ 
        [
            {
                category: { name: 'in', url: 'data/places.json' },
                name: 'France'
            },
            {
                category: { name: 'landform', url: 'data/landform.json' },
                name: 'coast'
            },
            {
                category: { name: 'where I can', url: 'data/todo.json', multiple: true },
                name: 'go out'
            }
        ],
        [
            {
                category: { name: 'temperature', url: 'data/temperature.json' },
                name: 'hot'
            },
            {
                category: { name: 'where I can', url: 'data/todo.json', multiple: true },
                name: 'eat gourmet food'
            },
            {
                category: { name: 'related to', url: 'data/related.json' },
                name: 'Harry Potter'
            }
        ],
        [
            {
                category: { name: 'where I can', url: 'data/todo.json', multiple: true },
                name: 'do wine tasting'
            },
            {
                category: { name: 'in', url: 'data/places.json' },
                name: 'Tuscany'
            },
            {
                category: { name: 'temperature', url: 'data/temperature.json' },
                name: 'hot'
            }
        ]
    ];
    
    var searchBox = $('#search_box').tokenInput(
        categoryList,
        {
            hintText: '<li>in <span>France</span>, landform <span>coast</span>, temperature <span>mild</span>, where I can <span>go out</span></li><li>temperature <span>hot</span>, where I can <span>eat gourmet food</span>, related to <span>Harry Potter</span></li><li>where I can <span>do wine tasting</span>, in <span>Tuscany</span>, temperature <span>hot</span></li>',
            objectExample: examples,
            spinner: $('.spinner'),
            suggestionTextClass: 'token-suggestion-color'
        }
    );
    
    $('.search-btn-container').on('click', function(){
        var tokens = searchBox.tokenInput('get');
        var message = 'You selected: ';
        for(var i = 0; i < tokens.length; i++){
            message += tokens[i].category.name + ': ' + tokens[i].name + ', ';
        }
        searchBox.tokenInput('clear');
        alert(message);
    });
    
    
})();