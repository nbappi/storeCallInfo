var elasticSearch = require('elasticsearch');

function createElasticSearchInstance() {
   return client = new elasticSearch.Client({
        host: 'localhost:9200'
    });
}

var client = createElasticSearchInstance();
var elasticObject = { index: 'comx-search' };

function pingEs(client) {
    client.ping({
        requestTimeout: "3000ms",
        hello: "elastic Search!"
    }, function (error) {
        if (error) {
            // console.trace('elastic Search cluster is down!');
        } else {
            // console.log('All is well');
        }
    });
}

function addToIndex( object , callback )
{
    pingEs(client);
    var commonObject = Object.assign( elasticObject, object );

    client.index( commonObject , function ( error, response )
    {
        if( error ) callback(error);
             callback(response);
    });
}

function updateToIndex(object , callback)
{
    pingEs(client);
    var commonObject = Object.assign( elasticObject, object );

     client.update( commonObject, function (error, response)
     {
        if(error) callback(error);
           callback(response);
     });
}

function deleteToIndex( object, callback )
{
    pingEs(client);
    var commonObject = Object.assign( elasticObject, object );

    client.delete( commonObject, function ( error, response )
    {
        if(error) callback(error);
          callback(response);
    });
}

function search(req ,callback)
{
    var data = req.body;
    var searchModule = { 'Contacts' : 'contacts', 'Currency' : "currency", 'Codes' : 'code'};
    var filters = [], permission = req.user_permission_array ;

    for(var i = 0 ; i < permission.length; i++)
    {
      if(typeof searchModule[permission[i]] != "undefined"){
        filters.push({ type: { value: searchModule[permission[i]]} });
      } 
    }

    client.search({
        index: 'comx-search',
        from : data.from ,
        size : data.size,
        body: {
        query: {
            "multi_match" : {
              "query":    data.searchQuery,
              "type":"best_fields",
              "fields": [ "search_object"]
            }
        },
        
        "highlight" : {
            "tag_schema" : "styled",
            "pre_tags" : ["<strong>"],
            "post_tags" : ["</strong>"],
            "fields" : {
             "search_object": {"type" : "plain"}
            }
          },
        },
    }, function (error, response) {
        if(error) callback(error);
          if(response.hits)
          {
              var hits = response.hits.hits;
          }
          callback(hits);
       }
    );
}

function checkExistId( object, callback)
{
    var commonObject = Object.assign( elasticObject, object );
    client.exists( commonObject, function (error, value) {
         callback(value);
    });
}

module.exports = {
    'addToIndex':addToIndex,
    'deleteToIndex':deleteToIndex,
    'updateToIndex':updateToIndex,
    'search':search,
    'checkExistId':checkExistId
};
