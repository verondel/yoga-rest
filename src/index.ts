import { PrismaClient } from '@prisma/client'
import express from 'express'

var cors = require('cors')

const prisma = new PrismaClient()
const app = express()

const cookierParser = require('cookie-parser')
app.use(cookierParser('abcdef-12345'))

require('dotenv').config()

var md5 = require('md5')
var jwt = require('jsonwebtoken')
var multer = require('multer');
var upload = multer();

// for parsing multipart/form-data
app.use(upload.array()); 

app.use(express.urlencoded()); // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json()) // Parse JSON bodies (as sent by API clients)

// var corsOptions = {
//   origin: 'http://localhost/3000',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }

// app.use(cors(corsOptions))
app.use(cors())

app.use(express.json())

var bodyParser = require('body-parser')
app.use(bodyParser())
// app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// ... your REST API routes will go here
// страница users
app.get('/users', async (req, res) => {
  const users = await prisma.client.findMany()
  res.json(users)
})

// main types of yoga
app.get('/typesAndLessons', async (req, res) => {
  const tp_lessons = await prisma.tp_lesson.findMany(
    {
      orderBy: [
        {
          id: 'asc',
        },
      ],
    }
  )
  interface Result {
    id: number,
    dt: string,
    full_name: Date,
    tp_lesson: string,
    discription: string
  }

  const lessons : Result[] = await prisma.$queryRaw`
    SELECT lesson.id, 
        lesson.dt AT TIME ZONE 'Europe/Moscow', 
        teacher.full_name, 
        tp_lesson.name, 
        tp_lesson.discription 
    FROM public.lesson
    INNER JOIN public.specialty_of_teacher ON lesson.id_specialty_of_teacher = specialty_of_teacher.id
    INNER JOIN public.teacher ON specialty_of_teacher.id_teacher = teacher.id
    INNER JOIN public.tp_lesson ON specialty_of_teacher.id_tp_lesson = tp_lesson.id
    WHERE public.lesson.dt BETWEEN (DATE_TRUNC('WEEK', CURRENT_DATE)) AND 
                            (DATE_TRUNC('WEEK', CURRENT_DATE) + INTERVAL '6 days')
    ORDER BY lesson.dt;
`
// tp_lesson.discription 

  let allDate = {tp_lessons, lessons}
  // console.log(allDate.lessons)

  res.json(allDate)
})



// main БУДУЩАЯ попытка забронировать
app.get('/attempt', async (req, res) => {
  const result = await prisma.$queryRaw`
    select s.dt_begin, s.dt_end, s.amount, c.full_name, c.id, c.phone
    from client as c, subscribe as s
    where c.id = s.id_client
    and c.phone = ${req.query.phone}
  `

  // const result1 = await prisma.$executeRawUnsafe(
  //   `select s.dt_begin, s.dt_end, s.amount, c.full_name, c.id, c.phone
  //   from client as c, subscribe as s
  //   where c.id = s.id_client
  //   and c.phone = '+7(111)111-11-11'`
  // )
  res.json(result)
})



app.post('/auth', async (req, res) => {
  console.log('я получил = ', req.body.params)
  // console.log('env KEY', process.env.TOKEN_KEY)
  // console.log(process.env.PASSWORD == md5(req.body.params.password + process.env.SOLE))

  let result = null;
  if ((process.env.LOGIN == req.body.params.login) &&
    (process.env.PASSWORD == md5(req.body.params.password + process.env.SOLE))) {
      const token = jwt.sign(
        { user_id: req.body.params.login },
        process.env.TOKEN_KEY,
      );
      console.log(token)
    // res.json(token)
    result = {
      auth: true,
      token: token
    }  
    
    res.json(result)

  } else {
    result = {
      auth: false
    }  
    res.json(result)
  }

})

// app.patch('/api/lessons', async (req, res) => {
//   console.log('i have 1',req.body)
// });

app.patch('/api/lessons', async (req, res) => {
  // console.log('length', Object.keys(req.body).length)
  if(Object.keys(req.body).length == 9){
    //TODO если не 9 то отсылаем обратно
    // day: 0 - вс, 1 - пн ... 6 - сб
    interface Options {
      year: string,
      month: string,
      day: string,
      hour: string,
      minute: string,
      second: string,
      hourCycle: string,
      hour12: boolean,
    }
    
    let options : Options  = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h24",
      hour12: false,
      // todo: numbers
      // timeZone: "Europe/Moscow",
    };

    type rowDate = {
      day: string;
      time: string;
    } | undefined

    const timetable : rowDate[] = []
    let lessonsDays: string[] = [];
    let inputsRealSubsequence = req.body.spanInnerHtmlNumbers
    let strDayOfWeek : string[] = inputsRealSubsequence.split(",")

                      // console.log('strDayOfweek',strDayOfWeek);

    // let strDayOfWeek : string[] = req.body.dayOfWeek
    let strTimeOfDay : string[] = req.body.timeOfDay
    let repeat: number = +req.body.reAmount; // кол-во занятий
    // let currentDay = new Date();
    let startYear : number = +req.body.dtStart.slice(0,4)
    let startMonth : number  = +req.body.dtStart.slice(5,7) - 1 
    let startDay : number = +req.body.dtStart.slice(8,10)
    let currentDay = new Date(startYear, startMonth, startDay);
                      // console.log('current Day',currentDay)

                      // console.log('-----------------------------------------------------------------')
                      // console.log('я собираю дату из этого', startYear, startMonth, startDay)
    // console.log('st_day', currentDay.toLocaleDateString("ru-RU"))


    strDayOfWeek.forEach((item: string, index: number) => {
      timetable.push({ day: strDayOfWeek[index] , time: strTimeOfDay[index] })
    });
                      // console.log('timetable', timetable)

    while (repeat > 0) {
      let numCurrentDayOfWeek : number = currentDay.getDay()
      let currentDayOfWeek: string = numCurrentDayOfWeek.toString();

      // console.log('stage 1', currentDay.toLocaleDateString("ru-RU"), numCurrentDayOfWeek, currentDayOfWeek, "SSS", strTimeOfDay)

      if (strDayOfWeek.includes(currentDayOfWeek)) {
        // console.log('stage 2', strDayOfWeek, ' includes', currentDayOfWeek)
        let index: number = strDayOfWeek.indexOf(currentDayOfWeek);
        // console.log('index now is ', index)

        // let hours : number = +(strTimeOfDay[index].slice(0,2))
        // let minutes : number = +(strTimeOfDay[index].slice(3, 5))

        // currentDay.setHours(hours); // изменить часы
        // currentDay.setMinutes(minutes);
        // currentDay.setSeconds(0);

        // console.log('cd', currentDay.toLocaleDateString("ru-RU")+ ' ' + strTimeOfDay[index]);
        lessonsDays.push(
          // new Date(currentDay)
          // new Intl.DateTimeFormat("ru-RU").format(currentDay)
          currentDay.toLocaleDateString("ru-RU") + ' ' + strTimeOfDay[index]
        );  
        repeat--;
      } 
      currentDay.setDate(currentDay.getDate() + 1); // добавляем 1 день
    }
    // console.log('your lessons plan', lessonsDays)
    // const result = await prisma.specialty_of_teacher.findMany({
    //   where: {
    //     id_tp_lesson: tpLesson 
    //   },
    //   select: {
    //     teacher: {
    //       select: {
    //         id: true,
    //         full_name: true
    //       }
    //     }
    //   }
    // });

    let teacherId : number = +req.body.teacher;
    let tp_lessonId : number = +req.body.tp_lesson;
    let id_hall : number = +req.body.hall
    let cmplx : number = +req.body.level

    interface Result {
      id: number
    }

    // console.log('Stage 3')
    const result : Result[] = await prisma.$queryRaw`
      SELECT st.id
        FROM specialty_of_teacher as st
      WHERE st.id_teacher = ${teacherId} 
        AND st.id_tp_lesson = ${tp_lessonId} 
    `
    // console.log('Stage 3.1', req.body)
    // console.log('Stage 4', result, teacherId, tp_lessonId)
    let id_specialty_of_teacher : number = result[0].id
    
    lessonsDays.forEach(async function(el) {
      // console.log('el',el)
      let year = +el.slice(6,10);
      let month = +el.slice(3,5) - 1;
      let day = +el.slice(0,3);
      let hour = +el.slice(11,13)
      let minute = +el.slice(14,16)
      // console.log('hour min', hour, minute)

      let today = new Date(year, month, day, hour, minute)
      // console.log('iterrable day', today.toLocaleDateString("ru-RU",{
      //   year: "numeric",
      //   month: "numeric",
      //   day: "numeric",
      //   hour: "numeric",
      //   minute: "numeric",
      //   second: "numeric",
      //   hourCycle: "h24",
      //   hour12: false,
      //   // todo: numbers
      //   // timeZone: "Europe/Moscow",
      // }))
      // console.log('adding lesson ', today)
      const lesson = await prisma.lesson.create({
        data: {
          id_hall: id_hall,
          id_specialty_of_teacher: id_specialty_of_teacher,
          dt : today,
          cmplx: cmplx,
        },
      })
    });
    // console.log('я в конце', req.body)
    res.send(req.body)
  }else{
    console.log('Форма заполнена не до конца')
    res.send('-1')
  }


  // res.json(req.body)
})

app.delete('/api/lessons', async (req, res) => {
  console.log(req.body)

  // console.log(req.data)
  const deleteLesson = await prisma.lesson.delete({
    where: {
      id: req.body.id,
    },
  })
  res.send("DELETE Request Called")
})

app.get('/api/lessons', async (req, res) => {
  
})


app.patch("/api/registration", async (req, res) => {

  console.log(req.body)
  // const user = await prisma.user.create({
  //   data: {
  //     email: 'elsa@prisma.io',
  //     name: 'Elsa Prisma',
  //   },
  // })
})


// app.patch('/api/teachers', async (req, res) => {
//   console.log('body', req.files)
//   res.send(req.file)
// })
// app.post('/api/lessons', async (req, res) => {
//   console.log('post запрос ',req)
//   res.send(req.query)
// })



app.get('/infoForNewLesson', async (req, res) => {
  const halls = await prisma.hall.findMany();
  const tp_lessons = await prisma.tp_lesson.findMany();

  interface Result {
    id: number,
    dt: string,
    full_name: string,
    tp_lesson: string,
    discription: string,
    timeForSystem: string,
    dateForSystem: string,
  }

  const lessons : Result[] = await prisma.$queryRaw`
    SELECT lesson.id, 
      lesson.dt AT TIME ZONE 'Europe/Moscow' as dt, 
      teacher.full_name as full_name, 
      tp_lesson.name as tp_lesson,
      hall.capacity as hall
    FROM public.lesson
    INNER JOIN public.specialty_of_teacher ON lesson.id_specialty_of_teacher = specialty_of_teacher.id
    INNER JOIN public.teacher ON specialty_of_teacher.id_teacher = teacher.id
    INNER JOIN public.tp_lesson ON specialty_of_teacher.id_tp_lesson = tp_lesson.id
    INNER JOIN public.hall ON lesson.id_hall = hall.id
    WHERE public.lesson.dt >= (DATE_TRUNC('WEEK', CURRENT_DATE))
    ORDER BY lesson.dt;
  `

  lessons.forEach(el => {
    const date = new Date(el.dt);
    const formattedDate = date
      .toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        year: "numeric",
        minute: "numeric",
        timeZone: "Europe/Moscow",
      })
      .replace(/,\s*/, ' ')
      .replace(/\./, '')
      .replace(/\./, '')
      .replace(/\sг\s/g, ' ');
    // console.log(formattedDate);

    let timeForSystem = formattedDate.slice(-5)
    let dateForSystem =date.toISOString().split('T')[0]
    el.timeForSystem = timeForSystem
    el.dateForSystem = dateForSystem

    // console.log(formattedDate)
    const teacher: string = el.full_name;
    const words = teacher.split(" ");
    const teacherInitials = `${words[0]} ${words[1][0]}.${words[2][0]}.`;

    el.dt = formattedDate;
    el.full_name = teacherInitials ;


  });

  // console.log('lessons', lessons);

  const all = {'halls': halls, 'tp_lessons':tp_lessons, 'lessons':lessons}
  res.json(all)
  // console.log(all)
  // console.log(halls)
})

app.get('/teachers', async (req, res) => {
  console.log(isNaN(Number("Хатха")),  isNaN(Number(req.query.tp_lesson)))
  console.log(!isNaN(Number("1")),  !isNaN(Number(req.query.tp_lesson)))
  
  if(!isNaN(Number(req.query.tp_lesson))){
    console.log('Число', req.query.tp_lesson)
    const tpLesson = Number(req.query.tp_lesson)
    // console.log("TPLESSON", tpLesson)
    // const result = await prisma.$queryRaw`
    //   select t.full_name
    //   from specialty_of_teacher as s, teacher as t 
    //   where s.id_tp_lesson = t.id
    //   and s.id_tp_lesson = ${tpLesson}
    // `

    const result = await prisma.specialty_of_teacher.findMany({
      where: {
        id_tp_lesson: tpLesson 
      },
      select: {
        teacher: {
          select: {
            id: true,
            full_name: true
          }
        }
      }
    });
    console.log(result)
    res.json(result)
  }else{
    console.log('Строка', req.query.tp_lesson)

    const result = await prisma.$queryRaw`
    SELECT t.full_name, t.id
FROM teacher as t
INNER JOIN specialty_of_teacher ON t.id = specialty_of_teacher.id_teacher
INNER JOIN tp_lesson ON tp_lesson.id = specialty_of_teacher.id_tp_lesson
WHERE tp_lesson.name = ${ req.query.tp_lesson }
    `

    /* same query using prisma 
    const teachersWithLesson = await prisma.teacher.findMany({
      where: {
        specialty_of_teacher: {
          some: {
            tp_lesson: {
              name: 'your_name'
            }
          }
        }
      },
      select: {
        full_name: true
      }
    });
    */

    console.log(result)
    res.json(result)
  }

})




// app.get('/admin1', async (req, res) => {
//   res.cookie('user', 'admin', {
//     signed: true,
//   })
//   res.send('cookie 1')

// })




app.listen(3001, () =>
  console.log('REST API server ready at: http://localhost:3001'),
)