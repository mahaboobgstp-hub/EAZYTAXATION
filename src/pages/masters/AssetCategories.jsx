import React, { useEffect, useState } from 'react';

import '../../css/masters/AssetCategories.css';

import {
  createAssetCategory,
  getAssetCategories
} from '../../services/assetCategoryService';

function AssetCategories() {

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    category_name: '',
    depreciation_rate: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {

    try {

      const data = await getAssetCategories();

      setCategories(data || []);

    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await createAssetCategory(formData);

      setFormData({
        category_name: '',
        depreciation_rate: ''
      });

      loadCategories();

    } catch (error) {
      alert(error.message);
    }
  };

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="asset-categories-page">

      <h2>Asset Categories</h2>

      <form
        className="asset-category-form"
        onSubmit={handleSubmit}
      >

        <input
          name="category_name"
          placeholder="Category Name"
          value={formData.category_name}
          onChange={handleChange}
          required
        />

        <input
          name="depreciation_rate"
          placeholder="Depreciation %"
          value={formData.depreciation_rate}
          onChange={handleChange}
        />

        <button type="submit">
          Save Category
        </button>

      </form>

      <table className="asset-category-grid">

        <thead>
          <tr>
            <th>Category Name</th>
            <th>Depreciation %</th>
          </tr>
        </thead>

        <tbody>

          {categories.map((category) => (

            <tr key={category.id}>
              <td>{category.category_name}</td>
              <td>{category.depreciation_rate}</td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default AssetCategories;
