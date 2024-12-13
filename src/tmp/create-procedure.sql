-- #UP
CREATE PROCEDURE ProcessUserData(
    IN userId INT,
    IN actionType VARCHAR(50),
    OUT result VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET result = 'Error occurred';
        ROLLBACK;
    END;

    START TRANSACTION;

    CASE actionType
        WHEN 'activate' THEN
            UPDATE users 
            SET status = 'active', 
                updated_at = NOW() 
            WHERE id = userId;
            SET result = 'User activated successfully';
            
        WHEN 'deactivate' THEN
            UPDATE users 
            SET status = 'inactive', 
                updated_at = NOW() 
            WHERE id = userId;
            SET result = 'User deactivated successfully';
            
        ELSE
            SET result = 'Invalid action type';
    END CASE;

    COMMIT;
END;


-- #DOWN
DROP PROCEDURE IF EXISTS ProcessUserData;