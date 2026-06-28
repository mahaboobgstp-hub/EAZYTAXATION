import React, { useEffect, useState } from 'react';
import UomDropdown from "../../components/dropdowns/UomDropdown";
import GstRateDropdown from "../../components/dropdowns/GstRateDropdown";
import '../../css/masters/Items.css';

import {
  createItem,
  getItems
} from '../../services/itemService';

function Items() {

  const [items, setItems] = useState([]);

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_type: 'Service',
    hsn_sac: '',
    unit: '',
    gst_rate: 18,
    sales_rate: '',
    purchase_rate: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {

    try {

      const data = await getItems();

      setItems(data || []);

    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await createItem(formData);

      alert('Item Saved Successfully');

      setFormData({
        item_code: '',
        item_name: '',
        item_type: 'Service',
        hsn_sac: '',
        unit: '',
        gst_rate: 18,
        sales_rate: '',
        purchase_rate: ''
      });

      loadItems();

    } catch (error) {

      alert(error.message);
    }
  };

  return (
    <div className="items-page">

      <h2>Items Master</h2>

      <form
        className="item-form"
        onSubmit={handleSubmit}
      >

        <input
          name="item_code"
          placeholder="Item Code"
          value={formData.item_code}
          onChange={handleChange}
        />

        <input
          name="item_name"
          placeholder="Item Name"
          value={formData.item_name}
          onChange={handleChange}
          required
        />

        <select
          name="item_type"
          value={formData.item_type}
          onChange={handleChange}
        >

          <option value="Service">
            Service
          </option>

          <option value="Goods">
            Goods
          </option>

        </select>

        <input
          name="hsn_sac"
          placeholder="HSN / SAC"
          value={formData.hsn_sac}
          onChange={handleChange}
        />

        <UomDropdown
    value={form.unit}
    onChange={handleChange}
/>

<GstRateDropdown
    value={form.gst_rate}
    onChange={handleChange}
/>

        <input
          name="sales_rate"
          placeholder="Sales Rate"
          value={formData.sales_rate}
          onChange={handleChange}
        />

        <input
          name="purchase_rate"
          placeholder="Purchase Rate"
          value={formData.purchase_rate}
          onChange={handleChange}
        />

        <button type="submit">
          Save Item
        </button>

      </form>

      <table className="item-grid">

        <thead>

          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>HSN/SAC</th>
            <th>GST %</th>
            <th>Sales Rate</th>
          </tr>

        </thead>

        <tbody>

          {items.map(item => (

            <tr key={item.id}>

              <td>{item.item_code}</td>
              <td>{item.item_name}</td>
              <td>{item.item_type}</td>
              <td>{item.hsn_sac}</td>
              <td>{item.gst_rate}</td>
              <td>{item.sales_rate}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Items;
