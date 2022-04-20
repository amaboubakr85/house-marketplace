import { useState, useEffect } from 'react'
import { collection, getDocs, where, orderBy, limit, startAfter, query } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import { db } from '../firebase.config'
import { toast } from 'react-toastify'
import Spinner from '../components/Spinner'
import ListingItem from '../components/ListingItem'

const Category = () => {
  // state
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastFetchedListing, setLastFetchedListing] = useState(null)

  // url params
  const params = useParams()

  // useEffect
  useEffect(() => {
    const fetchListings = async () => {
      try {
        // get Listings Refs
        const listingRefs = collection(db, 'listings')
        //   create a Query
        const q = query(
          listingRefs,
          where('type', '==', params.categoryName),
          orderBy('timestamp', 'desc'),
          limit(10)
        )

        //execute Query
        const querySnap = await getDocs(q)

        // pagination
        const lastVisible = querySnap.docs[querySnap.docs.length - 1]
        setLastFetchedListing(lastVisible)
        const listings = []
        querySnap.forEach((doc) => {
          listings.push({
            id: doc.id,
            data: doc.data(),
          })
        })
        setListings(listings)
        setLoading(false)
      } catch (error) {
        toast.error('Could not fetch listings ..')
      }
    }
    fetchListings()
  }, [params.categoryName])

  // Pagination / Load more ...

  const fetchLoadMoreListings = async () => {
    try {
      // get Listings Refs
      const listingRefs = collection(db, 'listings')
      //   create a Query
      const q = query(
        listingRefs,
        where('type', '==', params.categoryName),
        orderBy('timestamp', 'desc'),
        startAfter(lastFetchedListing),
        limit(10)
      )

      //execute Query
      const querySnap = await getDocs(q)

      // pagination
      const lastVisible = querySnap.docs[querySnap.docs.length - 1]
      setLastFetchedListing(lastVisible)
      const listings = []
      querySnap.forEach((doc) => {
        listings.push({
          id: doc.id,
          data: doc.data(),
        })
      })
      setListings((prevState) => [...prevState, ...listings])
      setLoading(false)
    } catch (error) {
      toast.error('Could not fetch listings ..')
    }
  }

  // console.log(lastFetchedListing)

  return (
    <>
      <div className='category'>
        <header>
          <p className='pageHeader'>
            {params.categoryName === 'rent' ? 'places for rent' : 'places for sale'}
          </p>
        </header>
        {loading ? (
          <Spinner />
        ) : listings && listings.length > 0 ? (
          <>
            <main>
              <ul className='categoryListings'>
                {listings.map((listing) => (
                  <ListingItem key={listing.id} listing={listing.data} id={listing.id} />
                ))}
              </ul>
            </main>

            <br />
            <br />

            {lastFetchedListing && (
              <p className='loadMore' onClick={fetchLoadMoreListings}>
                Load More{' '}
              </p>
            )}
          </>
        ) : (
          <p>no listings for {params.categoryName}</p>
        )}
      </div>
    </>
  )
}

export default Category
