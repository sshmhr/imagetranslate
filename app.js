// export GOOGLE_APPLICATION_CREDENTIALS=PATH_TO_KEY_FILE
var express = require("express");
var multer = require("multer");
var path = require("path");
const Translate = require('@google-cloud/translate');
const vision = require('@google-cloud/vision');
var app = express();
const projectId = 'viz-wiz';
const client = new vision.ImageAnnotatorClient();
app.use(express.static("./public"));
var x="",y= "",ext="";
var storage = multer.diskStorage({
    destination : './public/uploads',
    filename : function(req,file,clb){
        clb(null,file.fieldname  + path.extname(file.originalname));
    }
});

var upload = multer({
    storage:storage,
    limits:{fileSize:6000000},
    fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  ext=path.extname(file.originalname).toLowerCase();
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

// Routes
app.get("/",function(req,res){
    res.render("index.ejs");
});

app.post("/upload",function(req,res){
    upload(req,res,(err)=>{
        if(err){
            res.render("index.ejs",{msg:err});
        }else{
            if(req.file == undefined){
        res.render('index.ejs', {
          msg: 'Error: No File Selected!'
        });
      } else {
        res.render('index.ejs', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`
        });
      }
        }
    });
});

app.get("/translate/:lang",function(req,res){
  var lan = req.params.lang;
   const fileName =  './public/uploads/myImage'+ext;
        client
        .textDetection(fileName)
        .then(results => {
          const detections = results[0].textAnnotations;
          detections.forEach(text => x =x+text.description);
          if(x.lastIndexOf("\n")>0) {
          y=(x.substring(0, x.lastIndexOf("\n")));
          y = y.replace(/(\r\n|\n|\r)/gm," ");
          }
          // Instantiates a client
                    const translate = new Translate({
                     projectId: projectId,
                    });
                    // The text to translate
                    // console.log(y);
                    const text = y.toLowerCase();
                    // The target language
                    const target = lan;
                    
                    // Translates some text into Russian
                    translate
                      .translate(text, target)
                      .then(results => {
                        const translation = results[0];
                        y="";
                        x="";                    
                        // console.log(`${translation}`);
                        res.render("translate.ejs",{out:`${translation}`});
                        // console.log(1);
                      })
                      .catch(err => {
                        console.error('ERROR:', err);
                      });
        })
        .catch(err => {
          console.error('ERROR:', err);
        });
});

app.listen(process.env.PORT,process.env.IP,function(){
  console.log("Server Started :)");
});
