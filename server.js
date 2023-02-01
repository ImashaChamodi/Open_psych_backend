const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const { MongoServerClosedError } = require("mongodb");
const app = express();

const server = app.listen(3000, () => {
    console.log('server running on port 3000')
});

const io = socketIo(server);
app.use(cors());
app.use(express.json());



const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    usertype: String,
    id: String
})
const doctorSchema = new mongoose.Schema({
    name: String,
    email: String,
    telephone: String,
    workingstatus: String,
    specializedarea: String,
    id: String
})
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema)
const Item = mongoose.model('Item', itemSchema);

mongoose.set("strictQuery", false);
mongoose.connect('mongodb+srv://thirduser:ZS2YxkJVaRonvZQF@cluster0.defir6e.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));



app.post('/submitUser', (req, res) => {
    const userdata = req.body;

    const newUser = new User(userdata);
    newUser.save((error) => {
        if (error) {
            res.status(500).send(error);

        }
        else {
            res.status(200).json({
                success: true,
                message: 'form succesfully saved'
            });
        }
        
    });
});

app.post('/login', (req, res) => {
    User.find(req.body, (error, data) => {
        if (error) {
            res.status(500).send(error);
        }
        else {
            res.status(200).send(data);
        }
    })

});

app.post('/submitDoctor', (req, res) => {
    const doctordata = req.body;

    const newDoctor = new Doctor(doctordata);
    newDoctor.save((error) => {
        if (error) {
            res.status(500).send(error);

        }
        else {
            res.status(200).send('form succesfully saved');
        }
        
    });
});

app.put('/updateDoctor', (req, res) => {
    const doctordata = req.body;
    Doctor.updateOne({ id: doctordata.id }, { name: doctordata.name, email: doctordata.email, telephone: doctordata.telephone, workingstatus: doctordata.workingstatus, specializedarea: doctordata.specializedarea }, (error, result) => {
        if (error) {
            res.status(500).send(error);
        }
        else {
            res.status(200).send('form succesfully updated');
        }
    })
});


app.post('/getProfile', (req, res) => {
    Doctor.find(req.body, (error, data) => {
        if (error) {
            res.status(500).send(error);
        }
        else {
            res.status(200).send(data);
        }
    })

});

app.get('/getDoctorList', (req, res) => {
    Doctor.find({}, (err, data) => {
        if (err) {
            return res.send(err);
        } else {
            return res.send(data);
        }
    });
});

const socketDetails={};
const doctorToPatientMap={};

io.on('connection', (socket) => {

    socket.on('doctor_socket',(data)=>{
        const {doctorId} = data;
        socketDetails[doctorId]=socket;
    });


    socket.on('select_doctor', (data)=>{
        const {patientId,doctorId} = data;
        socketDetails[patientId]=socket;
        doctorToPatientMap[doctorId]=patientId;
    });

    socket.on('message',(data)=>{
        var {from,senderId,to,text,senderName} = data;
        if(from=='patient'&& doctorToPatientMap[to]){
            socketDetails[to].emit('message', {senderId,text,senderName});
        }
        else if(from=='doctor' && socketDetails[to]){
            socketDetails[to].emit('message', {senderId,text,senderName});
        }
    });
    
});


