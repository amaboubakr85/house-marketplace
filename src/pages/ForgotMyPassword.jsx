import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import { ReactComponent as ArrowRightIcon } from '../assets/svg/keyboardArrowRightIcon.svg'
import { toast } from 'react-toastify'

const ForgotMyPassword = () => {
  const [email, setEmail] = useState('')

  //!functions
  const onChange = (e) => {
    setEmail(e.target.value)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      const auth = getAuth()
      await sendPasswordResetEmail(auth, email)
      toast.success('Email sent!, check your email address ')
    } catch (error) {
      toast.error('email was not found in our DB ')
    }
  }

  return (
    <div className='pageContainer'>
      <header>
        <p className='pageHeader'>Forgot Password </p>
      </header>

      <main>
        <form onSubmit={onSubmit}>
          <input
            type='email'
            name='email'
            id='email'
            value={email}
            onChange={onChange}
            placeholder='Email'
            className='emailInput'
          />
          <Link to='/sign-in' className='forgotPasswordLink'>
            Sign In
          </Link>

          <div className='signInBar'>
            <div className='signInText'>Send Reset Password </div>
            <button className='signInButton'>
              <ArrowRightIcon fill='#fff' width={'34px'} height='34px' />
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default ForgotMyPassword
