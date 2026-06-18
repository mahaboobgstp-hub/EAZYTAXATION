import React, { useEffect, useState } from 'react';

import '../../css/masters/ExpenseCategories.css';

import {
  createExpenseCategory,
  getExpenseCategories
} from '../../services/expenseCategoryService';

function ExpenseCategories() {

  const [categories, setCategories] = useState([]);

  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategories();
      setCategories(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await createExpenseCategory({
        category_name: categoryName
      });

      setCategoryName('');

      loadCategories();

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="expense-categories-page">

      <h2>Expense Categories</h2>

      <form
        className="expense-category-form"
        onSubmit={handleSubmit}
      >

        <input
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) =>
            setCategoryName(e.target.value)
          }
          required
        />

        <button type="submit">
          Save Category
        </button>

      </form>

      <table className="expense-category-grid">

        <thead>
          <tr>
            <th>Category Name</th>
          </tr>
        </thead>

        <tbody>

          {categories.map((category) => (

            <tr key={category.id}>
              <td>{category.category_name}</td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default ExpenseCategories;
