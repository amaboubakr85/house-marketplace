import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
// Firebase & Fire store
import { getAuth, updateProfile } from 'firebase/auth'
import {
  updateDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../firebase.config'
import { toast } from 'react-toastify'

import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg'
import homeIcon from '../assets/svg/homeIcon.svg'
// import Spinner from '../components/Spinner'
import ListingItem from '../components/ListingItem'
// import { async } from '@firebase/util'

function Profile() {
  const auth = getAuth()

  // State
  const [changeDetails, setChangeDetails] = useState(false)
  const [FormData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  })

  const { name, email } = FormData

  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState(null)

  // Functions
  const navigate = useNavigate()

  const onLogout = () => {
    auth.signOut()
    navigate('/')
  }

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }))
  }

  const onSubmit = async () => {
    try {
      if (auth.currentUser.displayName !== name) {
        // update display name in firebase
        updateProfile(auth.currentUser, {
          displayName: name,
        })
        //  update user in fire store
        const userRef = doc(db, 'users', auth.currentUser.uid)
        await updateDoc(userRef, {
          name,
        })
      }
    } catch (error) {
      toast.error('something went wrong , please try again ..')
    }
  }

  const onDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        const listingRef = doc(db, 'listings', id)
        await deleteDoc(listingRef)
        const updatedListings = listings.filter((listing) => {
          return listing.id !== id
        })
        setListings(updatedListings)
        toast.success('listing deleted successfully')
      } catch (error) {
        toast.error('something went wrong , please try again ..')
      }
    }
  }

  const onEdit = (listingId) => navigate(`/edit-listing/${listingId}`)

  useEffect(() => {
    const fetchUserListings = async () => {
      const userListingRef = collection(db, 'listings')
      const q = query(
        userListingRef,
        where('userRef', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      )
      const querySnap = await getDocs(q)

      let listings = []
      querySnap.forEach((doc) => {
        return listings.push({
          id: doc.id,
          data: doc.data(),
        })
      })
      setListings(listings)
      setLoading(false)
    }

    fetchUserListings()
  }, [auth.currentUser.uid])

  return (
    <>
      <div className='profile'>
        <header className='profileHeader'>
          <p className='pageHeader'>My Profile</p>
          <button className='logOut' type='button' onClick={onLogout}>
            Logout
          </button>
        </header>

        <main>
          <div className='profileDetailsHeader'>
            <p className='profileDetailsText'>Personal Details</p>
            <p
              className='changePersonalDetails'
              onClick={() => {
                changeDetails && onSubmit()
                setChangeDetails((prevState) => !prevState)
              }}>
              {changeDetails ? 'Done' : 'Change'}
            </p>
          </div>

          <div className='profileCard'>
            <form>
              <input
                type='text'
                id='name'
                className={!changeDetails ? 'profileName' : 'profileNameActive'}
                disabled={!changeDetails}
                value={name}
                onChange={onChange}
              />
              <input
                type='text'
                id='email'
                className={!changeDetails ? 'profileEmail' : 'profileEmailActive'}
                disabled={!changeDetails}
                value={email}
                onChange={onChange}
              />
            </form>
          </div>
          <Link to={'/create-listing'} className='createListing'>
            <img src={homeIcon} alt='home' />
            <p>Sell Or Rent Your Home</p>
            <img src={arrowRight} alt='arrow' />
          </Link>
          {!loading && listings.length > 0 && (
            <>
              <p className='listingText'>Your Listings</p>
              <ul className='listingsList'>
                {listings.map((listing) => (
                  <ListingItem
                    key={listing.id}
                    listing={listing.data}
                    id={listing.id}
                    onDelete={() => onDelete(listing.id)}
                    onEdit={() => onEdit(listing.id)}
                  />
                ))}
              </ul>
            </>
          )}
        </main>
      </div>
    </>
  )
}

export default Profile
