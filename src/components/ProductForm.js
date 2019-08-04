import React, {Component} from "react";
import Axios from 'axios';
import {
	Stitch,
	RemoteMongoClient } from 'mongodb-stitch-browser-sdk';

import preloaderImage from  '../assets/images/preloader.svg';
import config from  '../config';

const API_KEY = config.keys.zinc_api;
const client = Stitch.initializeDefaultAppClient('amazonpricewatcher-sodvm');
const db = client.getServiceClient(RemoteMongoClient.factory, 'PriceWatcher').db('amazon_prices');


class ProductForm extends Component {
	constructor(props) {
		super(props)

		this.state = {
			productID: null,
			toggleError: false,
			toggleLoader: false,
			toggleLowerPrice: false
		}
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if(this.state.toggleLoader === true) {
			document.getElementById("loader").style.display = "block";
		}
		else {
			document.getElementById("loader").style.display = "none";
		}
		if(this.state.toggleLowerPrice === true) {
			document.getElementById("lower-price").style.display = "block";
		}
		else {
			document.getElementById("lower-price").style.display = "none";
		}
		if(this.state.toggleError === true) {
			document.getElementById("error-span").style.display = "block";
			document.getElementById("loader").style.display = "none";
		}
		else {
			document.getElementById("error-span").style.display = "none";
		}
	}

	checkProductPrice = (event) => {
		event.preventDefault();
		document.getElementById("btn-submit").innerText = "Checking...";
		this.setState({ toggleLoader: true });

		const newProduct = document.getElementById("amazon-product").value;
		let zincURL = `https://api.zinc.io/v1/products/${newProduct}/offers?retailer=amazon`;

		if(newProduct === "") {
			this.setState({ toggleError: true });
		}
		else {
			this.setState({ toggleError: false });
		}

		Axios.get(zincURL, {
			auth: {
				username: API_KEY
			}
		}).then((response) => {
			let respData = response.data;

			db.collection("products").insertOne({
				owner_id : client.auth.user.id,
				product_id: respData.asin,
				timestamp : respData.timestamp,
				price: respData.offers[0].price
			});

			db.collection("products").findOne({
				"product_id": respData.asin}, {limit: 1, $exists: true}).then(doc => {
					if(doc) {
						if(doc.price < respData.offers[0].price) {
							this.setState({ toggleLowerPrice: false });
						}
						else {
							this.setState({ toggleLowerPrice: true });
						}
					}
				let html = `<div>
					Product: 
						<a href="https://www.amazon.com/gp/offer-listing/${doc.product_id}/ref=dp_olp_all_mbc?ie=UTF8&condition=all" target="_blank">
							${doc.product_id}
						</a> - $${respData.offers[0].price.toFixed(2) / 100}
					</div>`;
				document.getElementById("product-list").innerHTML = html;
				this.setState({ toggleLoader: false });
				document.getElementById("btn-submit").innerText = "Check!"

			});
		})
		.catch((error) => {
			console.log(error);
		});


		this.setState({ productID: newProduct });
	}

    render() {
		const styles = {
			error: {
				color: 'red',
				display: 'none'
			},
			form: {
				paddingBottom: '15px'
			},
			loader: {
				display: 'none'
			},
			lowerPrice: {
				display: 'none',
				color: 'green'
			}
		}

        return (
            <div>
				<form style={styles.form} onSubmit={this.checkProductPrice.bind(this)}>
					<input id="amazon-product" type="text" placeholder={"ex: B00FE2N1WS"}/>&nbsp;
					<button id="btn-submit" type="submit">Check!</button>
					<div>
						<span id="error-span" style={styles.error}>Please enter a product ASIN to scan.</span>
					</div>
				</form>
				<div id="loader" style={styles.loader}>
					<img alt="" src={preloaderImage} />
				</div>
				<div id="lower-price" style={styles.lowerPrice}>
					Lower price!
				</div>
				<div id="product-list"></div>
			</div>
        );
    }
}

export default ProductForm;