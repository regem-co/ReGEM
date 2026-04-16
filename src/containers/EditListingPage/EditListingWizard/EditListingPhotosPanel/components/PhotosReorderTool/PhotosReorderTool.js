import React, { useState, useEffect, FC } from 'react';
import { ReactSortable } from "react-sortablejs";
import css from './PhotosReorderTool.module.css';


const PhotoPreview = (props) => {
  const { item } = props;

  if (item.image) {
    return (

      <div key={item.id} className={css.itemWrapper}>
        <img src={item.image} className={css.itemImage} />
      </div>
    )
  } else {
    return null
  }

}


export const PhotosReorderTool = (props) => {
  const { images, list, setList, imagesOrder } = props;


  useEffect(() => {

    const newImages = images.filter(i => {
      const index = imagesOrder?.findIndex(x => { return x.id === i.id.uuid })
      return index === -1
    });

    const convertedNewImages = newImages.map(h => {
      return ({
        id: h.id.uuid || h.imageId?.uuid,
        image: h.attributes?.variants['listing-card-2x'].url
      })
    })

    if (imagesOrder) {
      const finalList = [...imagesOrder, ...convertedNewImages].filter(img => {
        const index1 = images.findIndex(x => { return x.id.uuid === img.id || x.imageId?.uuid === img.id });
        return index1 >= 0
      })

      setList(finalList)
    } else {
      setList(images.map(i => {
        return ({
          id: i.id?.uuid || i.imageId?.uuid,
          image: i.attributes?.variants['listing-card-2x'].url
        })
      }))
    }

  }, [images])




  return (
    <ReactSortable list={list} setList={setList} className={css.sortWrapper}>
      {list.map((item) => (
        <PhotoPreview item={item} />
      ))}
    </ReactSortable>
  );
};

export default PhotosReorderTool