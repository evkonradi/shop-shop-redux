import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from '@apollo/react-hooks';

import { QUERY_PRODUCTS } from "../utils/queries";
import spinner from '../assets/spinner.gif'

import Cart from '../components/Cart';
import { idbPromise } from "../utils/helpers";

import { removeFromCart, updateCartQuantity, addToCart } from '../components/Cart/cartSlice';
import { updateProducts } from '../components/ProductList/productSlice';
import { useDispatch, useSelector } from 'react-redux';


function Detail() {

  const dispatch = useDispatch();
  const { id } = useParams();
  
  const [currentProduct, setCurrentProduct] = useState({})
  
  const { loading, data } = useQuery(QUERY_PRODUCTS);
  
  const cart = useSelector(state => state.cart.items);
  const products = useSelector(state => state.productItems.products);

  const addToCartClick = () => {
    const itemInCart = cart.find((cartItem) => cartItem._id === id);
  
    if (itemInCart) {

      dispatch(updateCartQuantity({
        _id: id, 
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1}));

      // if we're updating quantity, use existing item data and increment purchaseQuantity value by one
      idbPromise('cart', 'put', {
        ...itemInCart,
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1
      });
    } else {

      dispatch(addToCart({ ...currentProduct, purchaseQuantity: 1}));

      // if product isn't in the cart yet, add it to the current shopping cart in IndexedDB
      idbPromise('cart', 'put', { ...currentProduct, purchaseQuantity: 1 });
    }
  };

  const removeFromCartClick = () => {
    dispatch(removeFromCart({_id: currentProduct._id}))
    idbPromise('cart', 'delete', { ...currentProduct });
  };
  
  useEffect(() => {
    // already in global store
    if (products.length) {
      setCurrentProduct(products.find(product => product._id === id));
    } 
    // retrieved from server
    else if (data) {
      dispatch(updateProducts({products: data.products}));
  
      data.products.forEach((product) => {
        idbPromise('products', 'put', product);
      });
    }
    // get cache from idb
    else if (!loading) {
      idbPromise('products', 'get').then((indexedProducts) => {
        dispatch(updateProducts({products: indexedProducts}));
      });
    }
  }, [products, data, loading, dispatch, id]);
  

  return (
    <>
      {currentProduct ? (
        <div className="container my-1">
          <Link to="/">
            ← Back to Products
          </Link>

          <h2>{currentProduct.name}</h2>

          <p>
            {currentProduct.description}
          </p>

          <p>
            <strong>Price:</strong>
            ${currentProduct.price}
            {" "}
            <button onClick={addToCartClick}>
              Add to Cart
            </button>
            <button disabled={!cart.find(p => p._id === currentProduct._id)} onClick={removeFromCartClick}>
              Remove from Cart
            </button>
          </p>

          <img
            src={`/images/${currentProduct.image}`}
            alt={currentProduct.name}
          />
        </div>
      ) : null}
      {
        loading ? <img src={spinner} alt="loading" /> : null
      }
      <Cart />
    </>
  );
};

export default Detail;
