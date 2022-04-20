import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ReactComponent as RightArrow } from '../assets/svg/keyboardArrowRightIcon.svg'
import visibilityIcon from '../assets/svg/visibilityIcon.svg'
import spinner from '../assets/gif/loader.gif'
import { toast } from 'react-toastify'

// firebase
import { getAuth, updateProfile, createUserWithEmailAndPassword } from 'firebase/auth'
import { db } from '../firebase.config'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import OAuth from '../components/OAuth'

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { name, email, password } = formData
  const navigate = useNavigate()

  const onChange = (e) => {
    setFormData((prevState) => ({ ...prevState, [e.target.id]: e.target.value }))
  }
  console.log(formData)

  const onSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      if (name === '') {
        toast.warning('name can not be empty ')
      }
      if (email === '') {
        toast.warning('email can not be empty ')
      }
      if (password === '') {
        toast.warning('password can not be empty ')
      }
      const auth = getAuth()

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      const user = userCredential.user

      updateProfile(auth.currentUser, {
        displayName: name,
      })

      //  store use to fire store DB
      const formDataCopy = { ...formData }
      delete formDataCopy.password
      formDataCopy.timestamp = serverTimestamp()

      await setDoc(doc(db, 'users', user.uid), formDataCopy)
      setLoading(false)
      navigate('/')
    } catch (error) {
      // console.log(error)
      toast.error('Bad Credentials , try again later ')
      setLoading(false)
    }
  }

  return (
    <>
      <div className='pageContainer'>
        <header>
          <p className='pageHeader'>Welcome Back!</p>
        </header>
        <form onSubmit={onSubmit}>
          <input
            type='text'
            name='name'
            id='name'
            className='nameInput'
            value={name}
            onChange={onChange}
            placeholder='Full Name '
          />
          <input
            type='email'
            name='email'
            id='email'
            className='emailInput'
            value={email}
            onChange={onChange}
            placeholder=' Email Address'
          />
          <div className='passwordInputDiv'>
            <input
              type={showPassword ? 'text' : 'password'}
              name='password'
              id='password'
              className='passwordInput'
              value={password}
              onChange={onChange}
              placeholder=' Password'
            />
            <img
              src={visibilityIcon}
              alt='show password'
              value={password}
              className='showPassword'
              onClick={() => setShowPassword((prevState) => !prevState)}
            />
          </div>
          <Link to={'/forgot-password'} className={'forgotPasswordLink'}>
            Forgot Password
          </Link>
          <div className='signUpBar'>
            <p className='signUpText'>Sign Up</p>
            <button type='submit' className='signUpButton' disabled={loading}>
              {loading ? (
                <img src={spinner} width='36px' height='36px' alt='spinner ' />
              ) : (
                <RightArrow fill='#fff' width={'34px'} height='34px' />
              )}
            </button>
          </div>
        </form>

        <OAuth />
        <Link to='/sign-in' className='registerLink'>
          Sign In Instead
        </Link>
      </div>
    </>
  )
}

export default SignUp
