import { useState, useEffect, useRef } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { toast } from 'react-toastify'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase.config'
import { v4 as uuidv4 } from 'uuid'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const EditListing = () => {
  // state
  // eslint-disable-next-line
  const [geolocationEnabled, setGeolocationEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [listing, setListing] = useState()
  const [formData, setFormData] = useState({
    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    latitude: 0,
    longitude: 0,
  })

  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    latitude,
    longitude,
  } = formData

  const auth = getAuth()
  const navigate = useNavigate()
  const params = useParams()
  const isMounted = useRef(true)

  // redirect if user does not own listing
  useEffect(() => {
    if (listing && listing.userRef !== auth.currentUser.uid) {
      toast.error('You do not own this listing')
      navigate('/')
    }
  }, [auth.currentUser.uid, listing, navigate])

  // fetch listing data to edit
  useEffect(() => {
    setLoading(true)
    const fetchListing = async () => {
      const docRef = doc(db, 'listings', params.listingId)
      const docSnapshot = await getDoc(docRef)
      if (docSnapshot.exists()) {
        setListing(docSnapshot.data())
        setFormData({ ...docSnapshot.data(), address: docSnapshot.data().location })
        setLoading(false)
      } else {
        navigate('/')
        toast.error('Listing not found')
      }
    }
    fetchListing()
  }, [navigate, params.listingId])

  // set userRef to Logged in user
  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormData({ ...formData, userRef: user.uid })
        } else {
          navigate('/sign-in')
        }
      })
    }
    return () => {
      isMounted.current = false
    }
    //   if something happened or you seen missing dependency  use eslint disable next line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted])

  // ! input states changes

  const onMutate = (e) => {
    let boolean = null
    if (e.target.value === 'true') {
      boolean = true
    }
    if (e.target.value === 'false') {
      boolean = false
    }

    // files
    if (e.target.files) {
      setFormData((prevState) => ({ ...prevState, images: e.target.files }))
    }

    // Text / Numbers / Booleans
    if (!e.target.files) {
      //! if the value was true or false will return the boolean value otherwise will return the actual value or text for example or numbers
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }))
    }
  }

  // !form Submit

  const onSubmit = async (e) => {
    e.preventDefault()
    // console.log(formData)
    setLoading(true)
    if (+discountedPrice >= +regularPrice) {
      setLoading(false)
      toast.error('Discounted price must be less than regular price')
      return
    }

    if (images > 6) {
      setLoading(false)
      toast.error('You can only upload 6 images')
      return
    }

    let geolocation = {}
    let location
    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyApkxk0E9L0ttF-RSK8eZiQAerbkhFYmc0`
      )

      const data = await response.json()
      // console.log(data)
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0

      location = data.status === 'ZERO_RESULTS' ? undefined : data.results[0]?.formatted_address
      if (location === undefined || location.includes('undefined')) {
        setLoading(false)
        toast.error('Please enter a correct address')
        return
      }
    } else {
      geolocation.lat = latitude
      geolocation.lng = longitude
      // location = address
      console.log(geolocation, location)
    }

    // Upload files or images

    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage()
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`
        const storageRef = ref(storage, 'images' + fileName)
        // Upload the file and metadata
        const uploadTask = uploadBytesResumable(storageRef, image)

        // Register three observers:
        // 1. 'state_changed' observer, called any time the state changes
        // 2. Error observer, called on failure
        // 3. Completion observer, called on successful completion
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            console.log('Upload is ' + progress + '% done')
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused')
                break
              case 'running':
                console.log('Upload is running')
                break
              default:
                break
            }
          },
          (error) => {
            reject(error)
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL)
            })
          }
        )
      })
    }

    // upload images
    const imgUrls = await Promise.all([...images].map((image) => storeImage(image))).catch(() => {
      setLoading(false)
      toast.error('images not uploaded ..')
      return
    })
    // console.log(imgUrls)

    // submit data to firestore databae of formData
    const formDataCopy = {
      ...formData,
      geolocation,
      imgUrls,
      timestamp: serverTimestamp(),
    }
    formDataCopy.location = address
    delete formDataCopy.images
    delete formDataCopy.address
    // location && (formDataCopy.location = location)
    !formDataCopy.offer && delete formDataCopy.discountedPrice

    //   update listing
    const docRef = doc(db, 'listings', params.listingId)
    await updateDoc(docRef, formDataCopy)
    setLoading(false)
    toast.success('Listing added successfully')
    navigate(`/category/${formDataCopy.type}/${docRef.id}`)
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <>
      <div className='profile'>
        <header>
          <p className='pageHeader'>Edit Listing </p>
        </header>
        <main>
          <form onSubmit={onSubmit}>
            {/*  Rent || Sale */}
            <label htmlFor='type' className='formLabel'>
              Sell / Rent
            </label>
            <div className='formButtons'>
              <button
                type='button'
                id='type'
                value='sale'
                onClick={onMutate}
                className={type === 'sale' ? 'formButtonActive' : 'formButton'}>
                Sell
              </button>
              <button
                type='button'
                id='type'
                value='rent'
                className={type === 'rent' ? 'formButtonActive' : 'formButton'}
                onClick={onMutate}>
                Rent
              </button>
            </div>
            {/* Name */}
            <label htmlFor='name' className='formLabel'>
              Name
            </label>
            <input
              type='text'
              className='formInputName'
              id='name'
              value={name}
              onChange={onMutate}
              maxLength={'32'}
              minLength={'10'}
              required
            />
            {/* Bedrooms & Bathrooms */}
            <div className='formRooms flex'>
              <div>
                <label className='formLabel'>Bedrooms</label>
                <input
                  className='formInputSmall'
                  type='number'
                  id='bedrooms'
                  value={bedrooms}
                  onChange={onMutate}
                  min='1'
                  max='50'
                  required
                />
              </div>
              <div>
                <label className='formLabel'>Bathrooms</label>
                <input
                  className='formInputSmall'
                  type='number'
                  id='bathrooms'
                  value={bathrooms}
                  onChange={onMutate}
                  min='1'
                  max='50'
                  required
                />
              </div>
            </div>
            {/* Parking  */}
            <label className='formLabel'>Parking spot</label>
            <div className='formButtons'>
              <button
                className={parking ? 'formButtonActive' : 'formButton'}
                type='button'
                id='parking'
                value={true}
                onClick={onMutate}
                min='1'
                max='50'>
                Yes
              </button>
              <button
                className={!parking && parking !== null ? 'formButtonActive' : 'formButton'}
                type='button'
                id='parking'
                value={false}
                onClick={onMutate}>
                No
              </button>
            </div>
            {/* Furnished */}
            <label className='formLabel'>Furnished</label>
            <div className='formButtons'>
              <button
                className={furnished ? 'formButtonActive' : 'formButton'}
                type='button'
                id='furnished'
                value={true}
                onClick={onMutate}>
                Yes
              </button>
              <button
                className={!furnished && furnished !== null ? 'formButtonActive' : 'formButton'}
                type='button'
                id='furnished'
                value={false}
                onClick={onMutate}>
                No
              </button>
            </div>
            {/* Address  */}
            <label className='formLabel'>Address</label>
            <textarea
              className='formInputAddress'
              type='text'
              id='address'
              value={address}
              onChange={onMutate}
              required
            />

            {/*  map & geolocation */}
            {!geolocationEnabled && (
              <div className='formLatLng flex'>
                <div>
                  <label className='formLabel'>Latitude</label>
                  <input
                    className='formInputSmall'
                    type='number'
                    id='latitude'
                    value={latitude}
                    onChange={onMutate}
                    required
                  />
                </div>
                <div>
                  <label className='formLabel'>Longitude</label>
                  <input
                    className='formInputSmall'
                    type='number'
                    id='longitude'
                    value={longitude}
                    onChange={onMutate}
                    required
                  />
                </div>
              </div>
            )}
            {/* Offer */}
            <label className='formLabel'>Offer</label>
            <div className='formButtons'>
              <button
                className={offer ? 'formButtonActive' : 'formButton'}
                type='button'
                id='offer'
                value={true}
                onClick={onMutate}>
                Yes
              </button>
              <button
                className={!offer && offer !== null ? 'formButtonActive' : 'formButton'}
                type='button'
                id='offer'
                value={false}
                onClick={onMutate}>
                No
              </button>
            </div>
            {/* regular price  */}
            <label className='formLabel'>Regular Price</label>
            <div className='formPriceDiv'>
              <input
                className='formInputSmall'
                type='number'
                id='regularPrice'
                value={regularPrice}
                onChange={onMutate}
                min='50'
                max='750000000'
                required
              />
              {type === 'rent' && <p className='formPriceText'>$ / Month</p>}
            </div>
            {/* Offer */}
            {offer && (
              <>
                <label className='formLabel'>Discounted Price</label>
                <input
                  className='formInputSmall'
                  type='number'
                  id='discountedPrice'
                  value={discountedPrice}
                  onChange={onMutate}
                  min='50'
                  max='750000000'
                  required={offer}
                />
              </>
            )}

            {/* images */}
            <label className='formLabel'>Images</label>
            <p className='imagesInfo'>The first image will be the cover (max 6).</p>
            <input
              className='formInputFile'
              type='file'
              id='images'
              onChange={onMutate}
              max='6'
              accept='.jpg,.png,.jpeg'
              multiple
              required
            />
            <button type='submit' className='primaryButton createListingButton'>
              Edit Listing
            </button>
          </form>
        </main>
      </div>
    </>
  )
}

export default EditListing
