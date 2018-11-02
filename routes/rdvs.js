var express = require('express');
var router = express.Router();
const MONGOOSE = require('mongoose');
const Rdv = require('../models/rdv');
//let Rdv = MONGOOSE.model('Rdv',Rdv.schema);
const ObjectId = MONGOOSE.Types.ObjectId;




/* GET all rdvs listing. */

/**
 * @api {get} /api/movies List rdvs
 * @apiName RetrieveMovies
 * @apiGroup Rdv
 * @apiVersion 1.0.0
 * @apiDescription Retrieves a paginated list of rdvs
 *
 * @apiUse RdvInResponseBody
 * @apiUse MovieIncludes
 * @apiUse Pagination
 *
 * @apiParam (URL query parameters) {String} [director] Select only movies directed by the person with the specified ID (this parameter can be given multiple times)
 * @apiParam (URL query parameters) {Number} [rating] Select only movies with the specified rating (exact match)
 * @apiParam (URL query parameters) {Number} [ratedAtLeast] Select only movies with a rating greater than or equal to the specified rating
 * @apiParam (URL query parameters) {Number} [ratedAtMost] Select only movies with a rating lesser than or equal to the specified rating
 *
 * @apiExample Example
 *     GET /api/movies?director=58b2926f5e1def0123e97bc0&page=2&pageSize=50 HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *     Link: &lt;https://evening-meadow-25867.herokuapp.com/api/movies?page=1&pageSize=50&gt;; rel="first prev"
 *
 *     [
 *       {
 *         "id": "58b2926f5e1def0123e97281",
 *         "title": "Die Hard",
 *         "rating": 7.4,
 *         "directorHref": "/api/people/58b2926f5e1def0123e97bc0",
 *         "createdAt": "1988-07-12T00:00:00.000Z"
 *       },
 *       {
 *         "id": "58b2926f5e1def0123e97282",
 *         "title": "Die Hard With a Vengance",
 *         "rating": 8.3,
 *         "directorHref": "/api/people/58b2926f5e1def0123e97bc0",
 *         "createdAt": "1995-05-19T00:00:00.000Z"
 *       }
 *     ]
 */

router.get('/', function(req, res, next) {
  let query = Rdv.find();
  // Filter rdv by ctiy
  if (typeof req.query.city !== 'undefined') {
      query = query.where('city', req.query.city);
  }
  // Filter rdv by category
  if (typeof req.query.category !== 'undefined') {
      query = query.where('category', req.query.category);
  }
  // Filter rdv by creator
  if (typeof req.query.creator !== 'undefined') {
      query = query.where('creator', req.query.creator);
  }

//-----------------------------------
  //Aggregation

  const people = [ /* List of Person documents from the database */ ];
// Get the documents' IDs
const personIds = people.map(person => person._id);
Movie.aggregate([
  {
    $match: { // Select movies directed by the people we are interested in
      director: { $in: personIds }
    }
  },
  {
    $group: { // Group the documents by director ID
      _id: '$director',
      moviesCount: { // Count the number of movies for that ID
        $sum: 1
      }
    }
  }
], function(err, results) {
  // Use the results...
});


const people = [ /* List of Person documents from the database */ ];
const results = [ /* Aggregation results */ ];
// Convert the Person documents to JSON
const peopleJson = people.map(person => person.toJSON());
// For each result...
results.forEach(function(result) {
  // Get the director ID (that was used to $group)...
  const resultId = result._id.toString();
  // Find the corresponding person...
  const correspondingPerson = peopleJson.find(person => person.id == resultId);
  // And attach the new property
  correspondingPerson.directedMoviesCount = result.moviesCount;
});
// Send the enriched response
res.send(peopleJson);

//-------------------------------------------

  query.exec(function (err,docs){
      if (err)  {
        console.warn("Could not get all rdvs");
        next(err); //Fait suivre le message d'erreur
      }
      else{
        res.send(docs);
      }
  });
});


/**
 * Get a rdv by ID
 */

 //OK
router.get('/:id',loadRdvById, function(req, res, next) {
  let query = Rdv.find({});
  query.exec(function (err,docs)
  {
      if (err)
      {
          console.warn("Could not get all rdvs");
          next(err); //Fait suivre le message d'erreur
      }else{
          res.send(docs); //Renvoi des data
      }
  });
});


/**
 * Modify a rdv
 */
router.patch('/:id',loadRdvById,function(req, res, next) {
    if (req.body.city !== undefined) {
        req.rdv.city = req.body.city;
    }
    if (req.body.npa !== undefined) {
        req.rdv.npa = req.body.npa;
    }
    if (req.body.street !== undefined) {
        req.rdv.street = req.body.street;
    }
    if (req.body.streetNumber !== undefined) {
        req.rdv.streetNumber = req.body.streetNumber;
    }
    if (req.body.description !== undefined) {
        req.rdv.description = req.body.category;
    }

    req.rdv.save(function(err, savedRdv) {
        if (err) {
            return next(err);
        }
        console.log(`Updated rdv "${savedRdv.purposeTitle}"`);
        res.send(savedRdv);
    });
});



//Faire attention à remodifier la partie exemple correctement

/**
 * @api {post} /api/rdvs Create a rdv
 * @apiName CreateRdv
 * @apiGroup Rdv
 * @apiVersion 1.0.0
 * @apiDescription Registers a new rdv.
 *
 * @apiUse MovieInRequestBody
 * @apiUse MovieInResponseBody
 * @apiUse MovieValidationError
 * @apiSuccess (Response body) {String} id A unique identifier for the movie generated by the server
 *
 * @apiExample Example
 *     POST /api/rdvs HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "city": "Yverdon-les-Bains",
 *       "street": "Avenue des Sports",
 *       "npa": "1280"
 *       "streetNumber": "12"
 *       "purposeTitle": "Partie de Magic"
 *       "description": "Cherche un geek chaud à se faire une partie au calme"
 *       "category": "Magic"
 *     }
 *
 * @apiSuccessExample 201 Created
 *     HTTP/1.1 201 Created
 *     Content-Type: application/json
 *     Location: https://evening-meadow-25867.herokuapp.com/api/rdv/58b2926f5e1def0123e97281
 *
 *     {
 *       "city": "Yverdon-les-Bains",
 *       "street": Avenue des Sports,
 *       "npa": "1280"
 *       "streetNumber": "12"
 *       "purposeTitle": "Partie de Magic"
 *       "description": "Cherche un geek chaud à se faire une partie au calme"
 *       "category": "Magic"



 *       "directorHref": "/api/people/58b2926f5e1def0123e97bc0",
 *       "createdAt": "1988-07-12T00:00:00.000Z"
 *     }
 */


 //tests OK
router.post('', function(req, res, next) {
    new Rdv(req.body).save(function(err, savedrdv) {
        if (err) {
            return next(err);
        }
        console.log(`Rdv created "${savedrdv}"`);
        res.status(201).send(savedrdv);
    });
});


/**
 * Delete a rdv
 */

 //Test OK
router.delete('/:id', loadRdvById, function(req, res, next) {
    req.rdv.delete(function(err) {
        if (err) {
            return next(err);
        }
        //  console.log(`Deleted rdv "${req.rdv.}"`);
        res.sendStatus(204);
    });
});

/**
 * Load a rdv
 */
function loadRdvById(req, res, next){
    const rdvId = req.params.id;
    if (!ObjectId.isValid(rdvId)) {
        return rdvNotFound(res, rdvId);
    }

    let query = Rdv.findById(rdvId)

    query.exec(function(err, rdv) {
        if (err) {
            console.warn("Could not get the rdv");
            next(err); //Fait suivre le message d'erreur
        } else if (!rdv) {
            //TODO
            //return rdvNotFound(res, rdvId);
        }
        req.rdv = rdv;
        next();
    });
}
/**
 * Message in case of an "not found"
 * @param res
 * @param rdvId
 * @returns {*}
 */
function rdvNotFound(res, rdvId) {
    return res.status(404).type('text').send(`No rdv found with ID ${rdvId}`);
}
module.exports = router;
