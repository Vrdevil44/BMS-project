/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("lhfbq5wfsgacb46")

  // remove
  collection.schema.removeField("19wfzsms")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "xuvr6muu",
    "name": "UUID",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "lmn2v2h6ldv77fa",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("lhfbq5wfsgacb46")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "19wfzsms",
    "name": "UUID",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // remove
  collection.schema.removeField("xuvr6muu")

  return dao.saveCollection(collection)
})
