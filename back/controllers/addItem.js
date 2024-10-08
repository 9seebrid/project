const database = require('../database/database');

 
exports.addItem = async(req, res) => {
    const { userId } = req.params;
    const {product_id, quantity} = req.body;
    const defaultSize = '80g';
    if ( !userId || product_id === undefined || quantity === undefined){
        return res.status(400).json({error : 'Missing required fields'});
    }
    if( quantity <= 0 ){
        return res.status(400).json({error : 'Quantity must be greater than 0'})
    }
    try{
        const cartResult = await database.query('SELECT cart_id FROM Cart WHERE user_id = $1', [parseInt(userId, 10)]);
        if(cartResult.rows.length === 0) {
            return res.status(404).json({ error : 'Cart not found for this user'});
         }
         const cartId = cartResult.rows[0].cart_id;

         const query = `
         INSERT INTO CartItem (cart_id, product_id, quantity, added_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING cart_item_id
     `;
    //  
    const existingItemResult = await database.query(
        'SELECT quantity FROM CartItem WHERE cart_id = $1 AND product_id = $2 AND product_size = $3',
        [cartId, product_id, defaultSize]
      );
         
      if (existingItemResult.rows.length > 0) {
        // Update quantity if item already exists
        const newQuantity = existingItemResult.rows[0].quantity + 1;
        await database.query(
          'UPDATE CartItem SET quantity = $1 WHERE cart_id = $2 AND product_id = $3 AND product_size = $4',
          [newQuantity, cartId, product_id, defaultSize]
        );
        return res.status(200).json({ message: 'Item quantity updated successfully!' });
      } else {
        // Insert new item if it does not exist
        await database.query(
          'INSERT INTO CartItem (cart_id, product_id, quantity, product_size, added_at) VALUES ($1, $2, $3, $4, NOW())',
          [cartId, product_id, 1, defaultSize]
        );
        return res.status(201).json({ message: 'Item added successfully!' });
      }
    } catch (error) {
      console.error('Error adding item from sub page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

exports.addItemDetail = async (req, res) => {
    const { userId } = req.params;
    const { product_id, quantity, product_size } = req.body;

    if (!userId || product_id === undefined || quantity === undefined || product_size === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    try {
        // Cart ID 조회
        const cartResult = await database.query('SELECT cart_id FROM Cart WHERE user_id = $1', [parseInt(userId, 10)]);
        if (cartResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cart not found for this user' });
        }
        const cartId = cartResult.rows[0].cart_id;

        // 기존 항목 조회
        const existingItemResult = await database.query(
            'SELECT quantity FROM CartItem WHERE cart_id = $1 AND product_id = $2 AND product_size = $3',
            [cartId, product_id, product_size]
        );

        if (existingItemResult.rows.length > 0) {
            // 기존 항목이 있는 경우, 수량 업데이트
            const newQuantity = existingItemResult.rows[0].quantity + quantity;
            await database.query(
                'UPDATE CartItem SET quantity = $1, added_at = NOW() WHERE cart_id = $2 AND product_id = $3 AND product_size = $4',
                [newQuantity, cartId, product_id, product_size]
            );
            return res.status(200).json({ message: 'Item quantity updated successfully!' });
        } else {
            // 기존 항목이 없는 경우, 새로 삽입
            const query = `
                INSERT INTO CartItem (cart_id, product_id, quantity, product_size, added_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING cart_item_id
            `;
            const values = [cartId, product_id, quantity, product_size];
            const result = await database.query(query, values);
            const newCartItemId = result.rows[0].cart_item_id;
            return res.status(201).json({ message: 'Item added successfully!', cart_item_id: newCartItemId });
        }
    } catch (error) {
        console.error('Error processing cart item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addDiyitem = async(req,res) =>{
    const {userId} = req.params;
    const {product_id, quantity, product_size, is_bundle, selected_options} = req.body;
    const defaultQuantity = 1
    const defaultSize = null;
    const defaultBundle = true;
    if (!userId || product_id === undefined || quantity === undefined){
        return res.status(400).json({error : 'Missing required fields'});  
    }
    if( quantity <= 0 ){
        return res.status(400).json({error : 'Quantity must be greater than 0'})
    }
    try {
        const cartResult = await database.query('SELECT cart_id FROM Cart WHERE user_id = $1', [parseInt(userId, 10)]);
        if(cartResult.rows.length === 0){
            return res.status(404).json({ error: 'Cart not found for this user' });
        }
        const cartId = cartResult.rows[0].cart_id;
        const query = `
        INSERT INTO Cartitem (cart_id, product_id, quantity, product_size, is_bundle, selected_options, added_at )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING cart_item_id
        `;
        const values = [cartId, product_id, quantity || defaultQuantity, product_size || defaultSize, is_bundle || defaultBundle, selected_options]
        const result = await database.query(query, values)
        const newCartItemId = result.rows[0].cart_item_id;
        return res.status(201).json({ message: 'Item added successfully!', cart_item_id: newCartItemId });
    } catch (error) {
        console.error('Error processing cart item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}