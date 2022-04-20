import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { db } from '../firebase.config'
import { getDoc, doc } from 'firebase/firestore'

const Contact = () => {
  const [message, setMessage] = useState('')
  const [landlord, setLandlord] = useState(null)
  // eslint-disable-next-line
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useParams()

  useEffect(() => {
    const getLandlord = async () => {
      const docRef = doc(db, 'users', params.landlordId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setLandlord(docSnap.data())
      } else {
        toast.error('Landlord not found')
      }
    }
    getLandlord()
  }, [params.landlordId])

  return (
    <div className='pageContainer' style={{ minHeight: '120vh' }}>
      <header>
        <p className='pageHeader'>Contact Landlord</p>
      </header>
      {landlord !== null && (
        <main>
          <div className='contactLandlord'>
            <p className='landlordName'>Contact {landlord?.name}</p>
          </div>
          <form className='messageForm'>
            <div className='messageDiv'>
              <label className='messageLabel' htmlFor='message'>
                Message
              </label>
              <textarea
                name='message'
                id='message'
                className='textarea'
                value={message}
                onChange={(e) => setMessage(e.target.value)}></textarea>
            </div>
            <a
              href={`mailto:${landlord.email}?subject=${searchParams.get(
                'listingName'
              )}&body=${message}`}>
              <button className='primaryButton' type='button'>
                Send Message
              </button>
            </a>
          </form>
        </main>
      )}
    </div>
  )
}

export default Contact
