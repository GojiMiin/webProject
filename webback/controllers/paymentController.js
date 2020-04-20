var express = require('express')
var mongoose = require('mongoose');
var multer = require('multer');
var fs = require('fs');
var body = require('body-parser')
var formidable = require('formidable');
var path = require('path');
var app = express();
var users = require('../models/UserModel');
var pay = require('../models/paymentModel');
var book = require('../models/bookModel');

app.use(body.json());


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

var upload = multer({
    storage: storage
})


exports.sendList = function (req, res) {
    var items = ''
    users.findOne(req.body.usename, function (err, res) {
        if (err) throw err
        items = res.BookID.split(',')
        console.log(items)
    })
}

exports.getInformation = function (req, res) {

    var form = new formidable.IncomingForm();
    form.uploadDir = 'uploads';
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) {
          next(err);
          return;
        }
        //get type of file for rename
        let type = files.Receipt.type
        let useForRename = type.split("/")
        //change type of old path to string
        let oldPath = files.Receipt.path
        //rename image file
        fs.rename( oldPath, form.uploadDir + "/" + fields.BookID + "." + useForRename[1], (err, status) => {
            if(err) throw err
        })
        //generate paymentID
        let payID = ''
        let count = await pay.countDocuments()
        if (count == 0) {
            payID = 'P0001'
        } else {
            count += 1
            myID = '' + count
            while (myID.length < 4) {
                myID = '0' + myID
            }
            payID = 'P' + myID
        }

        let data = {
            PaymentID: payID,
            PayDate: fields.PayDate,
            PayTotal: fields.PayTotal,
            Bank: fields.Bank,
            PaymentStatus: "",
            PaymentImg: form.uploadDir + "/" + fields.BookID + "." + useForRename[1],
            BookID: fields.BookID,
            username: req.params.username
        };
        await pay.create(data)

    });
}

exports.frontInformation = async function (req, res) {
    let allPrice = []
    let want= {
        username : req.params.username
    }
    let send = {
        thisBookID : Object,
        thisPrice : Object
    }

    let userRaw = await users.findOne(want)
    let allBookID = userRaw.BookID.split(",")
    
    for(let i in allBookID){
        let eachID = {
            BookID : allBookID[i]
        }
        let IDPrice = await book.findOne(eachID)
        allPrice.push(IDPrice.Price) 
    }

    send.thisBookID = allBookID
    send.thisPrice = allPrice
    res.send(send)
    

}

