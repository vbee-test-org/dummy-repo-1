import express from "express"
import { getArticles, addArticle, deleteArticle, updateArticle, fulltextSearchArticles, autocompleteArticleSearch } from "../controllers/articlesController.js";

const router = express.Router()

/**
 * @openapi
 * components:
 *  schemas:
 *      Article:
 *          type: object
 *          properties:
 *              guid:
 *                  type: string
 *              article_link:
 *                  type: string
 *              website_source:
 *                  type: string
 *              article_title:
 *                  type: string
 *              _type:
 *                  type: string
 *              author:
 *                  type: string
 *              article_summary:
 *                  type: string
 *              article_detailed_content:
 *                  type: string
 *              creation_date:
 *                  type: string
 *              thumbnail_image:
 *                  type: string
 */

// Get all articls route
/**
 * @openapi
 * /v1/articles:
 *  get:
 *      description: Get all articles
 *      tags:
 *          - Articles
 *      responses:
 *          200:
 *              description: Show the number of avaliable articles and an array of articles
 *          500:
 *              description: Show error message     
 * 
 */
router.get("/", getArticles);

// Add new article route
/**
 * @openapi
 * /v1/articles:
 *  post:
 *      description: Create an article
 *      tags:
 *          - Articles
 *      requestBody:
 *          description: Update an existing article
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Article'
 *      responses:
 *          400:
 *              description: All fields are required!!!
 *          200:
 *              description: Article created
 *          500:
 *              description: Show error message     
 * 
 */
router.post("/", addArticle);

// Delete an article
/**
 * @openapi
 * /v1/articles/{id}:
 *  delete:
 *      description: Delete an article
 *      tags:
 *          - Articles
 *      responses:
 *          400:
 *              description: Incorrect id or Article not found
 *          200:
 *              description: Article was deleted
 *          500:
 *              description: Show error message     
 * 
 */
router.delete("/:id", deleteArticle);

// Update an article

/**
 * @openapi
 * /v1/articles/{id}:
 *  put:
 *      description: Update an article
 *      tags:
 *          - Articles
 *      parameters:
 *          - name: id
 *            in: path
 *            descrpintion: ID of the article that you want to delete
 *            required: true
 *            schema:
 *              type: string
 *      requestBody:
 *          description: Update an existing article
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Article'
 *      responses:
 *          400:
 *              description: All fields required, Incorrect id or Article not found
 *          200:
 *              description: Article was updated
 *          500:
 *              description: Show error message     
 * 
 */
router.put("/:id", updateArticle);

// Search for articles
/**
 * @openapi
 * /v1/articles/search?text={...}&sort={asc/desc}:
 *  get:
 *      description: Full-text search
 *      tags:
 *          - Articles
 *      responses:
 *          200:
 *              description: Show the result
 *          500:
 *              description: Show error message     
 * 
 */
router.get("/search", fulltextSearchArticles);

// Autocomplete search
router.get("/autocomplete", autocompleteArticleSearch);

export { router as articlesRoutes }