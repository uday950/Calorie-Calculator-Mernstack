const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const Fatsecret = require('../FatSecret');
const DayPlan = require("../models/DayPlan");
const moment = require('moment');



//get Food result
router.get('/foodsearch/:search', async (req, res) => {
  // const fatSecretAPI =  new Fatsecret(process.env.KEY,process.env.SECRET);
  const fatSecretAPI = new Fatsecret('74d5c1a21ce94f4caa58fd5aef1d04e5', '4dfde12990cf45a5a03527595b7a6ef5');

  fatSecretAPI.method('foods.search', {
    search_expression: req.params.search,
    max_results: 10
  })
    .then(function (results) {
      // console.log(results.foods.food);
      res.status(200).send(results.foods.food);
    })
    .catch(err => console.error(err));

})

//middleware to verify JWT, Otherwise reject request if not valid
const privateKey = '7f58842e-546e-41ec-86cc-98688aff65e5';
router.use((req, res, next) => {
  const token = req.get('token');

  console.log("token", token);

  jwt.verify(token, privateKey, { algorithms: ["HS256"] }, (err, decoded) => {
    if (!err) {
      req.user = decoded //store userinfo in requset object
      next();  //middleware complete, move to next endpoint
    } else {
      res.status(401).send("Please login");
    }
  })
})


// create new plan
router.post('/newDayPlan', async (req, res) => {

  //convert date format comes from body to mongoDB format
  const firstFormat = moment.utc(req.body.date); // formats to ISO 8601 String
  const toUnix = moment(firstFormat).format()
  removeZ = toUnix.substring(0, 19)
  otherVar = ".000+00:00"
  finalValue = removeZ.concat(otherVar)
  // console.log('final value', finalValue);

  try {

    //checking whether combination of userID & date exist
    const findExistingPlan = await DayPlan.find({ userId: req.body.userId, date: finalValue })
    console.log('date', moment(req.body.date).toISOString());
    if (findExistingPlan.length < 1) {
      const newDayPlan = await DayPlan.create(req.body);
      res.status(200).send(newDayPlan);
    } else {
      console.log("findExistingPlan", findExistingPlan);
      // res.send("plan exist");
      res.redirect(307, '/api/food/updateDayPlan');
    }

  } catch (e) {
    console.log('create error', e);
    res.status(400).send("Bad request");
  }
})

// update plan
router.post('/updateDayPlan', async (req, res) => {

  //convert date format comes from body to mongoDB format
  const firstFormat = moment.utc(req.body.date); // formats to ISO 8601 String
  const toUnix = moment(firstFormat).format()
  removeZ = toUnix.substring(0, 19)
  otherVar = ".000+00:00"
  finalValue = removeZ.concat(otherVar)
  // console.log('final value', finalValue);

  try {
    // find all plans under below userID
    const findExistingPlan = await DayPlan.find({ userId: req.user.id , date: finalValue })
    console.log('req.body',req.body);

    //conditions to add new record to the existing one
    if (findExistingPlan.length >= 1) {
      console.log('findExistingPlan', findExistingPlan[0]);
      const existingPlan = findExistingPlan[0];
      console.log('servingsize', req.body.meal.breakfast[0].servingSize);
      if(req.body.meal.breakfast[0].servingSize){
        existingPlan.meal.breakfast.push(req.body.meal.breakfast[0]);
      }
      console.log('existingPlan',existingPlan);
      // find a plans with chosen date and updat that one
      const updateExistingPlan = await DayPlan.findOneAndUpdate({ date: finalValue }, {$set:existingPlan}, { new: true })
      res.status(200).send(updateExistingPlan);
    } else {
      res.redirect(307, '/api/food/newDayPlan');
    }
  } catch (e) {
    console.log(e);
    res.status(400).send("Bad request");
  }
})


//get dayPlan
router.post('/dayPlan', async (req, res) => {
  try {
    //convert date format comes from body to mongoDB format
    const firstFormat = moment.utc(req.body.date); // formats to ISO 8601 String
    const toUnix = moment(firstFormat).format()
    removeZ = toUnix.substring(0, 19)
    otherVar = ".000+00:00"
    finalValue = removeZ.concat(otherVar)

    const dayPlan = await DayPlan.find({ userId: req.user.id, date: finalValue });
      res.status(200).send(dayPlan);
  }catch(e){
    console.log("e",e);
    res.status(400).send("bad request");
}
})
   


module.exports = router;