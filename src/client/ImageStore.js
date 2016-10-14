import _ from 'lodash';
import axios from 'axios';
import {computed,action,observable} from 'mobx';

export class Image {
  @observable data;

  constructor(data) {
    this.data = data;
  }
  
  @computed get id() {
    return this.data._id;
  }

  @computed get galleryId() {
    return this.data.galleryId;
  }

  @computed get author() {
    return this.data.authorCid;
  }

  @computed get filename() {
    return this.data.filename;
  }

  @computed get thumbnail() {
    return `/v1/image/${this.data._id}/thumbnail`;
  }
  
  @computed get fullSize() {
    return `/v1/image/${this.data._id}/fullSize`;
  }

  @computed get preview() {
    return `/v1/image/${this.data._id}/preview`;
  }
  
  @computed get tags() {
    return this.data.tags.toJS();
  }
  
  @action addTag(tagName) {
    const imageId = this.data._id;
    
    const imageTag = {
      imageId: imageId,
      tagName: tagName
    };
    
    return axios.post(`/v1/image/${imageId}/tags`, imageTag)
      .then((() => {
        this.data.tags.push(tagName);
      }).bind(this));
  }
}

export class ImageGalleryList {
  @observable images = [];
  @observable galleryId = null;
  
  constructor(galleryId, images) {
    this.galleryId = galleryId;
    this.images = images;
  }

  fetchImages() {
    return axios.get(`/v1/image/${this.galleryId}`)
      .then((response => {
        this.images = _.map(response.data, data => {
          return new Image(data);
        });
      }).bind(this));
  }

  @action addImages(formData, progressCallback) {
    const config = {
      progress: (event => {
        const decimalPercentage = event.loaded / event.total;
        const percent = Math.round(decimalPercentage * 10000) / 100;
        progressCallback(percent);
      })
    };
    
    return axios.post(`/v1/image/${this.galleryId}`, formData, config)
      .then((() => {
        this.fetchImages();
      }).bind(this));
  }
}

export class ImagesForTagList {
  @observable images = [];
  @observable tag = null;
  
  constructor(tag) {
    this.tag = tag;
    this.fetchImages();
  }

  fetchImages() {
    axios.get(`/v1/image/tags/${this.tag}/search`)
      .then((response => {
        this.images = _.map(response.data, data => {
          return new Image(data);
        });
      }).bind(this));
  }
}

export class ImageStore {
  @action getImagesForTag(tag) {
    return new ImagesForTagList(tag);
  }

  static fetchImagesInGallery(galleryId) {
    return axios.get(`/v1/image/${galleryId}`)
      .then((response => {
        const images = _.map(response.data, data => {
          return new Image(data);
        });

        return Promise.resolve(images);
      }).bind(this));
  }
}

export default ImageStore;
