import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ReactComponent as RightArrow } from '../assets/svg/keyboardArrowRightIcon.svg'
import visibilityIcon from '../assets/svg/visibilityIcon.svg'
import { toast } from 'react-toastify'

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import OAuth from '../components/OAuth'

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const { email, password } = formData
  const navigate = useNavigate()

  const onChange = (e) => {
    // setFormData({ ...formData, [e.target.name]: e.target.value })
    // setFormData((prevState) => {
    //   return { ...prevState, [e.target.id]: e.target.value }
    // })
    setFormData((prevState) => ({ ...prevState, [e.target.id]: e.target.value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    try {
      const auth = getAuth()

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      // console.log(userCredential)

      if (userCredential.user) {
        navigate('/')
      }
    } catch (error) {
      toast.error('Invalid username or password ')
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
          <div className='signInBar'>
            <p className='signInText'>Sign In</p>
            <button type='submit' className='signInButton'>
              <RightArrow fill='#fff' width={'34px'} height='34px' />
            </button>
          </div>
        </form>
        {/* Google Auth Component  */}
        <OAuth />
        <Link to='/sign-up' className='registerLink'>
          Sign Up Instead
        </Link>
      </div>
    </>
  )
}

export default SignIn
