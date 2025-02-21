const router = require("express").Router()
const bcrypt = require('bcryptjs')
const User = require("../models/User.model")
const saltRounds = 10

const { isLoggedIn, checkRole } = require('./../middleware/route.guard')

// Signup
router.get('/registro', (req, res, next) => res.render('auth/signup'))
router.post('/registro', (req, res, next) => {

  const { userPwd } = req.body

  bcrypt
    .genSalt(saltRounds)
    .then(salt => bcrypt.hash(userPwd, salt))
    .then(hashedPassword => User.create({ ...req.body, password: hashedPassword }))
    .then(createdUser => res.redirect('/'))
    .catch(error => next(error))
})



// Login
router.get('/iniciar-sesion', (req, res, next) => res.render('auth/login'))
router.post('/iniciar-sesion', (req, res, next) => {

  const { email, userPwd } = req.body

  User
    .findOne({ email })
    .then(user => {
      if (!user) {
        res.render('auth/login', { errorMessage: 'Email no registrado en la Base de Datos' })
        return
      } else if (bcrypt.compareSync(userPwd, user.password) === false) {
        res.render('auth/login', { errorMessage: 'La contraseña es incorrecta' })
        return
      } else {
        req.session.currentUser = user
        res.redirect('/')
      }
    })
    .catch(error => next(error))
})


// Logout
router.post('/cerrar-sesion', (req, res, next) => {
  req.session.destroy(() => res.redirect('/iniciar-sesion'))
})


// List

router.get('/estudiantes', isLoggedIn, (req, res) => {

  User
    .find()
    .then(students => {
      res.render('auth/students', { students })
    })
    .catch(err => console.log(err))

})

// Profile

router.get('/perfil/:id', isLoggedIn, (req, res) => {

  const { id } = req.params
  const isPM = req.session.currentUser.role === 'PM'
  const isSameId = req.session.currentUser._id === req.params.id


  User
    .findById(id)
    .then(student => {
      res.render('auth/profile', { student, isPM, isSameId })
    })
    .catch(err => console.log(err))
})

// Delete user:

router.post('/estudiantes/:id', (req, res) => {

  const { id } = req.params

  User
    .findByIdAndDelete(id)
    .then(() => {
      res.redirect('/estudiantes')
    })
    .catch(err => console.log(err))
})

// Update user:

router.get('/estudiantes/:id/editar', (req, res) => {
  const { id } = req.params
  User
    .findById(id)
    .then(students => {
      res.render('auth/edit-user', students)
    })
    .catch(err => console.log(err))

})

router.post('/estudiantes/:id/edit', (req, res) => {

  const { id } = req.params
  const { username, email, description } = req.body

  User
    .findByIdAndUpdate(id, { username, email, description })
    .then(() => {
      res.redirect(`/perfil/${id}`)
    })
    .catch(err => console.log(err))

})

// EDIT TA Y DEV

router.post('/estudiantes/:id/editar/TA', isLoggedIn, checkRole('PM'), (req, res, next) => {
  const { id } = req.params

  User
    .findByIdAndUpdate(id, { role: 'TA' })
    .then(() => {
      res.redirect('/estudiantes')
    })
    .catch(err => {
      console.log(err)
    })
})

router.post('/estudiantes/:id/editar/DEV', isLoggedIn, checkRole('PM'), (req, res, next) => {
  const { id } = req.params

  User
    .findByIdAndUpdate(id, { role: 'DEV' })
    .then(() => {
      res.redirect('/estudiantes')
    })
    .catch(err => {
      console.log(err)
    })
})



module.exports = router
