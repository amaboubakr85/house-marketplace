import { useState, useEffect } from 'react'
import { db } from '../firebase.config'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore'
import SwiperCore, { Navigation, Pagination, Scrollbar, A11y } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
// import 'swiper/swiper-bundle.css'
import 'swiper/css/bundle'
import Spinner from './Spinner'

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y])
const Slider = () => {
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState(null)

  const navigate = useNavigate()
  useEffect(() => {
    const fetchListings = async () => {
      const listingsRef = collection(db, 'listings')
      const q = query(listingsRef, orderBy('timestamp', 'desc'), limit(5))
      const querySnap = await getDocs(q)

      let listings = []
      querySnap.forEach((doc) => {
        listings.push({
          id: doc.id,
          data: doc.data(),
        })
      })
      setListings(listings)
      setLoading(false)
    }

    fetchListings()
  }, [])
  if (loading) {
    return <Spinner />
  }

  if (listings.length === 0) {
    return <></>
  }

  return (
    listings && (
      <>
        <p className='exploreHeading'>Recommended </p>
        <Swiper
          slidesPerView={1}
          pagination={{ clickable: true }}
          style={{ height: '300px', cursor: 'pointer' }}>
          {listings.map(({ data, id }) => {
            return (
              <SwiperSlide key={id} onClick={() => navigate(`/category/${data.type}/${id}`)}>
                <div
                  className='swiperSlideDiv'
                  style={{
                    background: `url(${data.imgUrls[0]}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}>
                  <p className='swiperSlideText'>{data.name}</p>
                  <p className='swiperSlidePrice'>
                    ${data.discountedPrice ?? data.regularPrice} {data.type === 'rent' && '/ month'}
                  </p>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </>
    )
  )
}

export default Slider
