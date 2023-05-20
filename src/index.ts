import { PrismaClient } from '@prisma/client'
import express from 'express'

var cors = require('cors')
let tester: number = 0

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


// REST API routes go from here
interface Pages {
  [hash: string]: number;
}
let allPages : Pages = {'hello':1}

app.get('/sse-endpoint', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(`event: message\ndata: ${JSON.stringify(allPages)}\n\n`);
  send(res)
});

app.post('/sse-endpoint', (req, res) => {
  if (allPages.hasOwnProperty(req.body.hash)) {
    delete allPages[req.body.hash]
  } 
  res.send('hel lo')
})

function send(res: any){
  res.write(`event: message\ndata: ${JSON.stringify(allPages)}\n\n`);
  setTimeout(() => send(res), 2000)
}


// страница users
app.get('/users', async (req, res) => {
  const users = await prisma.client.findMany()
  res.json(users)
})

// main types of yoga
app.get('/typesAndLessons', async (req, res) => {
  interface Result {
    dt: Date,
    part?: number
    id?: number,
    dtTd?: Date,
    strDt?: string,
    strTime?: string,
    strTeacher?: string,
    full_name?: string,
    tp_lesson?: string,
    id_tp_lesson?: number,
    color?: string,
    discription?: string
    delBorder?: boolean
  }

  const tp_lessons = await prisma.tp_lesson.findMany(
    {
      orderBy: [
        {
          id: 'asc',
        },
      ],
    }
  )

  const lessons: Result[] = await prisma.$queryRaw`
    SELECT lesson.id, 
        lesson.dt, 
        teacher.full_name, 
        tp_lesson.id as id_tp_lesson,
        tp_lesson.name as tp_lesson
    FROM public.lesson
    INNER JOIN public.specialty_of_teacher ON lesson.id_specialty_of_teacher = specialty_of_teacher.id
    INNER JOIN public.teacher ON specialty_of_teacher.id_teacher = teacher.id
    INNER JOIN public.tp_lesson ON specialty_of_teacher.id_tp_lesson = tp_lesson.id
    WHERE public.lesson.dt BETWEEN (DATE_TRUNC('WEEK', CURRENT_DATE)) AND 
                            (DATE_TRUNC('WEEK', CURRENT_DATE) + INTERVAL '7 days')
    ORDER BY lesson.dt;
  `

  let colors: string[] = [
    '#32a1ce', // blue
    '#32CF7D', // green   
    '#AF32CF', // purple
    '#CF9832', // orange
    '#CF326E',  // burgundy
    '#CFCF32', // yellow
    '#CF3234', // red
  ]

  let lessonsWithDuplicates: Result[] = []
  // make dublicates for td
  lessons.forEach(lesson => {
    let dtLesson: Date = new Date(lesson.dt)
    let delBorder: boolean = (dtLesson.getMinutes() == 45) ? true : false

    const formattedDate = dtLesson
      .toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
      })


    let formattedTime = dtLesson
      .toLocaleString("ru-RU", {
        hour: "numeric",
        minute: "numeric",
        timeZone: "UTC",
      })

    const teacher: string | undefined = lesson.full_name;
    if (teacher && lesson.id_tp_lesson) {
      const words = teacher.split(" ");
      const teacherInitials = `${words[0]} ${words[1][0]}.${words[2][0]}.`;

      Object.assign(lesson, {
        part: 0,
        dtTd: dtLesson,
        strDt: formattedDate,
        strTime: formattedTime,
        strTeacher: teacherInitials,
        color: colors[lesson.id_tp_lesson],
        delBorder: delBorder
      })
      lessonsWithDuplicates.push(lesson)

      // parts from 1-6 
      for (let i = 1; i < 6; i++) { // занятие длится 1,5 часа 
        let date = new Date(lesson.dt)
        let newDate = new Date(date.setMinutes(date.getMinutes() + 15 * i))
        let nextDelBorder: boolean = (newDate.getMinutes() == 45) ? true : false

        lessonsWithDuplicates.push(
          {
            part: i,
            id: lesson.id,
            full_name: lesson.full_name,
            tp_lesson: lesson.tp_lesson,
            dt: newDate,
            dtTd: dtLesson,
            strDt: formattedDate,
            strTime: formattedTime,
            strTeacher: teacherInitials,
            color: colors[lesson.id_tp_lesson],
            delBorder: nextDelBorder
          })
      }
    }
  });

  lessonsWithDuplicates.sort((a, b) => {
    const timeA = new Date(a.dt).getTime();
    const timeB = new Date(b.dt).getTime();
    return timeA - timeB;
  });

  let months = [
    "янв",
    "фев",
    "мар",
    "апр",
    "май",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ];
  let hoursForTable: String[] = [
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
    "24:00",
  ];

  let minutesForTable: String[] = ["0", "15", "30", "45"];

  const currentDay = new Date();
  let todayDate = currentDay.getDate();
  let todayMonth = months[currentDay.getMonth()];
  let todayStr = todayDate + " " + todayMonth;

  while (currentDay.getDay() !== 1) {
    currentDay.setDate(currentDay.getDate() - 1); // минус 1 день
  }

  let monday = new Date(currentDay);
  let mondayItterable = new Date(currentDay.setHours(3, 0, 0));

  mondayItterable.setDate(currentDay.getDate() - 1);
  let timeschtampForTd: Date[] = [];

  // генерация массива со всеми timeschtamp для td
  hoursForTable.forEach((time) => {
    mondayItterable.setHours(+time.slice(0, 2));
    mondayItterable.setSeconds(0);
    mondayItterable.setMilliseconds(0);
    minutesForTable.forEach((minutes) => {
      for (let i = 0; i < 7; i++) {
        mondayItterable.setDate(mondayItterable.getDate() + 1);
        mondayItterable.setMinutes(+minutes);
        let newDt = new Date(mondayItterable);
        timeschtampForTd.push(newDt);
      }
      mondayItterable.setDate(mondayItterable.getDate() - 7);
    });
  });

  let mondayNumber = currentDay.getDate();
  let mondayMonth = months[currentDay.getMonth()];
  let datesOfCurrentWeek = [];
  datesOfCurrentWeek.push(mondayNumber + " " + mondayMonth);
  for (let i = 0; i < 6; i++) {
    monday.setDate(monday.getDate() + 1);
    let nextDay = new Date(monday);
    let day = nextDay.getDate();
    datesOfCurrentWeek.push(day + " " + months[monday.getMonth()]);
  }

  let scheduleForTable: Result[] = []

  timeschtampForTd.forEach(dt => {
    let lessonExists: boolean = false

    for (let i = 0; i < lessonsWithDuplicates.length; i++) {
      if (dt.toString() == lessonsWithDuplicates[i].dt.toString()) {
        lessonExists = true
        scheduleForTable.push(lessonsWithDuplicates[i])
        break
      }
    }
    if (!lessonExists) {
      scheduleForTable.push({ dt: dt })
    }
  });

  const timestamp = Date.now().toString();
  const hash : string = md5(timestamp).toString();
  allPages[hash] = 0

  let allDate = { tp_lessons, datesOfCurrentWeek, todayStr, scheduleForTable, hash }
  res.json(allDate)
})



// main info for booking
app.get('/attempt', async (req, res) => {

  interface Result {
    id: number,
    dt_begin: Date,
    dt_end: Date,
    amount: number,
    full_name: string,
    phone: string,
  }

  const result: Result[] = await prisma.$queryRaw`
    select s.dt_begin, s.dt_end, s.amount, c.full_name, c.id, c.phone
    from client as c, subscribe as s
    where c.id = s.id_client
    and c.phone = ${req.query.phone}
  `
  if (Object.keys(result).length == 0) {
    res.json('-1')
  } else {
    res.json(result)
  }
})



app.post('/auth', async (req, res) => {
  let result = null;
  if ((process.env.LOGIN == req.body.params.login) &&
    (process.env.PASSWORD == md5(req.body.params.password + process.env.SOLE))) {
    const token = jwt.sign(
      { user_id: req.body.params.login },
      process.env.TOKEN_KEY,
    );
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


app.patch('/api/lessons', async (req, res) => {
  if (Object.keys(req.body).length == 9) {
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

    let options: Options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h24",
      hour12: false,
    };

    type rowDate = {
      day: string;
      time: string;
    } | undefined

    const timetable: rowDate[] = []
    let lessonsDays: string[] = [];
    let inputsRealSubsequence = req.body.spanInnerHtmlNumbers
    let strDayOfWeek: string[] = inputsRealSubsequence.split(",")

    let oldTimeOfDay: string[] = req.body.timeOfDay
    let strTimeOfDay: string[] = []

    oldTimeOfDay.forEach(el => {
      let hours = +el.slice(0, 2)
      let minutes = el.slice(3)
      hours += 3
      strTimeOfDay.push(`${hours}:${minutes}`)
    });

    let repeat: number = +req.body.reAmount; // кол-во занятий
    let startYear: number = +req.body.dtStart.slice(0, 4)
    let startMonth: number = +req.body.dtStart.slice(5, 7) - 1
    let startDay: number = +req.body.dtStart.slice(8, 10)
    let currentDay = new Date(startYear, startMonth, startDay);

    strDayOfWeek.forEach((item: string, index: number) => {
      timetable.push({ day: strDayOfWeek[index], time: strTimeOfDay[index] })
    });

    while (repeat > 0) {
      let numCurrentDayOfWeek: number = currentDay.getDay()
      let currentDayOfWeek: string = numCurrentDayOfWeek.toString();

      if (strDayOfWeek.includes(currentDayOfWeek)) {
        let index: number = strDayOfWeek.indexOf(currentDayOfWeek);
        lessonsDays.push(
          currentDay.toLocaleDateString("ru-RU") + ' ' + strTimeOfDay[index]
        );
        repeat--;
      }
      currentDay.setDate(currentDay.getDate() + 1); // добавляем 1 день
    }
    let teacherId: number = +req.body.teacher;
    let tp_lessonId: number = +req.body.tp_lesson;
    let id_hall: number = +req.body.hall
    let cmplx: number = +req.body.level

    interface Result {
      id: number
    }

    const result: Result[] = await prisma.$queryRaw`
      SELECT st.id
        FROM specialty_of_teacher as st
      WHERE st.id_teacher = ${teacherId} 
        AND st.id_tp_lesson = ${tp_lessonId} 
    `

    let id_specialty_of_teacher: number = result[0].id
    lessonsDays.forEach(async function (el) {
      let year = +el.slice(6, 10);
      let month = +el.slice(3, 5) - 1;
      let day = +el.slice(0, 3);
      let hour = +el.slice(11, 13)
      let minute = +el.slice(14, 16)

      let today = new Date(year, month, day, hour, minute)
      const lesson = await prisma.lesson.create({
        data: {
          id_hall: id_hall,
          id_specialty_of_teacher: id_specialty_of_teacher,
          dt: today,
          cmplx: cmplx,
        },
      })
    });
    tester = 1
    for (const key in allPages) {
      allPages[key] = 1;
    }
    res.send(req.body)
  } else {
    res.send('-1') //'Форма заполнена не до конца
  }
})



app.delete('/api/lessons', async (req, res) => {
  let id_lesson = req.body.id
  const deleteBooks = await prisma.book.deleteMany({
    where: {
      id_lesson: id_lesson,
    },
  })

  const deleteLesson = await prisma.lesson.delete({
    where: {
      id: id_lesson,
    },
  })
  tester = 1
  for (const key in allPages) {
    allPages[key] = 1;
  }
  res.send("DELETE Request Called")
})


// CHANGE LESSON
app.post('/api/lessons', async (req, res) => {
  interface Specialty {
    id: number,
  }
  let year = req.body.dt.slice(0, 4)
  let month = req.body.dt.slice(5, 7) - 1
  let day = req.body.dt.slice(8)
  let hour = req.body.time.slice(0, 2)
  let minute = req.body.time.slice(3)
  let hall = +req.body.hall
  let lessonTS = new Date(year, month, day, hour, minute).getTime()
  lessonTS += 10800000 // добавить 3 часа 
  let lessonDt = new Date(lessonTS)
  let id_teacher = +req.body.teacher
  let id_tp_lesson = +req.body.tp_lesson

  const specialty_of_teacher: Specialty[] = await prisma.$queryRaw`
    SELECT id 
    FROM specialty_of_teacher sot 
    WHERE id_tp_lesson = ${id_tp_lesson} and id_teacher = ${id_teacher}
  `
  let SOT = +specialty_of_teacher[0].id

  const updateLesson = await prisma.lesson.update({
    where: {
      id: +req.body.ID,
    },
    data: {
      dt: lessonDt,
      id_hall: hall,
      id_specialty_of_teacher: SOT
    },
  })

  for (const key in allPages) {
    allPages[key] = 1;
  }

  res.send(req.query)
})



app.patch("/api/registration", async (req, res) => {
  // console.log(req.body)
  const client = await prisma.client.create({
    data: {
      full_name: req.body.fullName,
      dt_birthday: req.body.dtBirth,
      passport: req.body.passport,
      phone: req.body.phone,
      email: req.body.email
    },
  })

  interface idFromDb {
    id: string
  }

  const idFromDb: idFromDb[] = await prisma.$queryRaw`
    SELECT c.id
    FROM public.client as c
    WHERE c.full_name = ${req.body.fullName}
  `

  let fullNameArr = req.body.fullName.split(' ')
  let name = fullNameArr[1]
  let id = idFromDb[0].id
  res.send({ id: id, name: name })
})



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

  const lessons: Result[] = await prisma.$queryRaw`
    SELECT lesson.id, 
      lesson.dt as dt, 
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
        timeZone: "UTC",
      })
      .replace(/,\s*/, ' ')
      .replace(/\./, '')
      .replace(/\./, '')
      .replace(/\sг\s/g, ' ');

    let timeForSystem = formattedDate.slice(-5)
    let dateForSystem = date.toISOString().split('T')[0]
    el.timeForSystem = timeForSystem
    el.dateForSystem = dateForSystem

    const teacher: string = el.full_name;
    const words = teacher.split(" ");
    const teacherInitials = `${words[0]} ${words[1][0]}.${words[2][0]}.`;

    el.dt = formattedDate;
    el.full_name = teacherInitials;
  });

  const all = { 'halls': halls, 'tp_lessons': tp_lessons, 'lessons': lessons }
  res.json(all)
})



app.get('/teachers', async (req, res) => {
  if (!isNaN(Number(req.query.tp_lesson))) {
    const tpLesson = Number(req.query.tp_lesson)

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
    res.json(result)
  } else {
    const result = await prisma.$queryRaw`
      SELECT t.full_name, t.id
      FROM teacher as t
      INNER JOIN specialty_of_teacher ON t.id = specialty_of_teacher.id_teacher
      INNER JOIN tp_lesson ON tp_lesson.id = specialty_of_teacher.id_tp_lesson
      WHERE tp_lesson.name = ${req.query.tp_lesson}
    `
    res.json(result)
  }
})



app.patch('/api/book', async (req, res) => {
  // Первое пробное занятие
  let trialLesson: boolean = req.body.data.trialLesson
  let id_client = req.body.data.id_client
  let id_lesson = req.body.data.id_lesson
  let timeLesson = req.body.data.timeLesson

  if (trialLesson) {
    const subscribe = await prisma.subscribe.create({
      data: {
        id_client: id_client,
        dt_begin: timeLesson,
        dt_end: timeLesson,
        amount: 0,
      }
    })
    const book = await prisma.book.create({
      data: {
        id_subscribe: subscribe.id,
        id_lesson: id_lesson,
      }
    })

  } else {
    let amount = req.body.data.amount
    interface Subscribe {
      id: number,
    }

    const subscribeId: Subscribe[] = await prisma.$queryRaw`
      SELECT s.id
      FROM subscribe as s
      WHERE s.id_client = ${id_client}
    `

    const book = await prisma.book.create({
      data: {
        id_subscribe: subscribeId[0].id,
        id_lesson: id_lesson,
      }
    })

    const updateAmount = await prisma.subscribe.update({
      where: {
        id: subscribeId[0].id,
      },
      data: {
        amount: amount - 1,
      },
    })
  }

  res.send("0")
})


app.patch('/api/subsctiption', async (req, res) => {
  let id_client = +req.body.id_client
  let type = +req.body.type
  let dtLesson = new Date(req.body.dtLesson)
  let dtLessonTS = dtLesson.getTime()

  let dt_begin = dtLesson
  let dt_end: Date = dtLesson // далее в if изменится 
  let amount = 0

  if (type == 1) {
    dt_end = new Date(dtLesson)
  } else if (type == 4) {
    dt_end = new Date(dtLessonTS + 2678400000) // 31 день - 1 месяц
    amount = 4
  } else if (type == 6) {
    dt_end = new Date(dtLessonTS + 2678400000) // 31 день - 1 месяц
    amount = 6
  } else if (type == 8) {
    dt_end = new Date(dtLessonTS + 5270400000) // 61 день - 2 месяца
    amount = 8
  } else if (type == 12) {
    dt_end = new Date(dtLessonTS + 5270400000) // 61 день - 2 месяца
    amount = 12
  }

  interface Subscribe {
    id: number,
  }

  const subscribeId: Subscribe[] = await prisma.$queryRaw`
    SELECT s.id
    FROM subscribe as s
    WHERE s.id_client = ${id_client}
  `

  const updSubscribe = await prisma.subscribe.update({
    where: {
      id: subscribeId[0].id,
    },
    data: {
      dt_begin: dt_begin,
      dt_end: dt_end,
      amount: amount,
    },
  })
  res.json({dt_begin: dt_begin, dt_end:dt_end, amount:amount})
})



app.listen(3001, () =>
  console.log('REST API server ready at: http://localhost:3001'),
)
