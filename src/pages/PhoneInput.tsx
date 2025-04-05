import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { supabase } from '../lib/supabase';

interface RedemptionHistory {
  id: number;
  phone_number: string;
  points_used: number;
  created_at: string;
}

const PhoneInput = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number | null>(null);
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [openPointsDialog, setOpenPointsDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<RedemptionHistory[]>([]);

  const handleRedeem = async () => {
    try {
      if (!phoneNumber || !currentPoints || currentPoints < 10) {
        throw new Error('ไม่สามารถแลกแต้มได้');
      }

      const { error: updateError } = await supabase
        .from('points')
        .update({ 
          points: currentPoints - 10,
          updated_at: new Date().toISOString()
        })
        .eq('phone_number', phoneNumber);

      if (updateError) throw updateError;

      // บันทึกประวัติการแลก
      const { error: historyError } = await supabase
        .from('redemption_history')
        .insert([{ 
          phone_number: phoneNumber,
          points_used: 10,
        }]);

      if (historyError) throw historyError;
      
      setCurrentPoints(currentPoints - 10);
      setMessage('แลกแต้มสำเร็จ! คุณได้รับน้ำชา 1 แก้ว');
      setOpenRedeemDialog(false);
    } catch (error) {
      console.error('Error:', error);
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleViewHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('redemption_history')
        .select(`
          *,
          points!inner (
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
      setOpenHistoryDialog(true);
    } catch (error) {
      console.error('Error:', error);
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPoints = async () => {
    try {
      if (!/^[0-9]{10}$/.test(phoneNumber)) {
        throw new Error('กรุณากรอกเบอร์มือถือ 10 หลัก');
      }

      setIsLoading(true);
      const { data: record, error } = await supabase
        .from('points')
        .select('points')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (record) {
        setCurrentPoints(record.points);
      } else {
        setCurrentPoints(0);
      }

      setOpenPointsDialog(true);
    } catch (error) {
      console.error('Error:', error);
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setCurrentPoints(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleAddPoints = async (points: number) => {
    try {
      if (!/^[0-9]{10}$/.test(phoneNumber)) {
        throw new Error('กรุณากรอกเบอร์มือถือ 10 หลัก');
      }

      const { data: existingRecord, error: fetchError } = await supabase
        .from('points')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('points')
          .update({ 
            points: existingRecord.points + points,
            updated_at: new Date().toISOString()
          })
          .eq('phone_number', phoneNumber);

        if (updateError) throw updateError;
        setMessage(`อัพเดทแต้มสำเร็จ! เพิ่ม ${points} แต้ม ตอนนี้คุณมี ${existingRecord.points + points} แต้ม`);
        setCurrentPoints(existingRecord.points + points);
      } else {
        const { error: insertError } = await supabase
          .from('points')
          .insert([{ 
            phone_number: phoneNumber,
            points: points
          }]);

        if (insertError) throw insertError;
        setMessage(`เพิ่มแต้มสำเร็จ! คุณได้รับ ${points} แต้ม`);
        setCurrentPoints(points);
      }

      setPhoneNumber('');
    } catch (error) {
      console.error('Error:', error);
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleClear = () => {
    setPhoneNumber('');
    setCurrentPoints(null);
    setMessage('ล้างข้อมูลในฟอร์มเรียบร้อย');
    setOpenClearDialog(false);
    setOpenSnackbar(true);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    setCurrentPoints(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        '@media (max-width: 600px)': {
          minHeight: '-webkit-fill-available',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #f5f5f7',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        zIndex: 1,
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: '#000',
              fontWeight: 700,
              textAlign: 'center',
              letterSpacing: '1px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              fontSize: '1.8rem'
            }}
          >
            Moma's Tea Point
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}>
        <Typography
          variant="h6"
          sx={{
            color: '#86868b',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          สะสมแต้ม
        </Typography>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            fullWidth
            label="เบอร์มือถือ"
            variant="outlined"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            required
            inputProps={{ 
              pattern: "[0-9]*",
              inputMode: "numeric",
              maxLength: 10
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '56px',
                borderRadius: '8px',
                backgroundColor: '#f5f5f7',
                '&:hover fieldset': {
                  borderColor: '#1d1d1f',
                },
                '& input': {
                  color: '#000000',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                },
              },
              '& .MuiInputLabel-root': {
                fontFamily: 'Kanit',
                color: '#666666',
              },
              mb: 3,
            }}
          />

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
          }}>
            <Box sx={{
              display: 'flex',
              gap: 2,
            }}>
              <Button
                type="button"
                fullWidth
                variant="outlined"
                onClick={checkPoints}
                sx={{ 
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  borderColor: '#1d1d1f',
                  color: '#1d1d1f',
                  '&:hover': {
                    borderColor: '#1d1d1f',
                    backgroundColor: 'rgba(29, 29, 31, 0.04)',
                  },
                }}
              >
                เช็คยอดแต้ม
              </Button>
              <Button
                type="button"
                fullWidth
                variant="outlined"
                onClick={handleViewHistory}
                sx={{ 
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  borderColor: '#1d1d1f',
                  color: '#1d1d1f',
                  '&:hover': {
                    borderColor: '#1d1d1f',
                    backgroundColor: 'rgba(29, 29, 31, 0.04)',
                  },
                }}
              >
                ดูประวัติ
              </Button>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                width: '100%',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((points) => (
                <Button
                  key={points}
                  onClick={() => handleAddPoints(points)}
                  variant="contained"
                  sx={{ 
                    height: '48px',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    backgroundColor: '#1d1d1f',
                    '&:hover': {
                      backgroundColor: '#2d2d2f',
                    },
                  }}
                >
                  +{points}
                </Button>
              ))}
            </Box>
            <Button
              onClick={() => handleAddPoints(10)}
              variant="contained"
              fullWidth
              sx={{ 
                height: '48px',
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: '8px',
                backgroundColor: '#1d1d1f',
                '&:hover': {
                  backgroundColor: '#2d2d2f',
                },
              }}
            >
              +10
            </Button>
          </Box>
        </form>

        {/* Redeem Section */}
        {currentPoints !== null && currentPoints >= 10 && (
          <Box sx={{ 
            mt: 3,
            p: 3,
            backgroundColor: '#f5f5f7',
            borderRadius: '12px',
          }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#1d1d1f',
                fontWeight: 500,
                mb: 2,
                textAlign: 'center',
              }}
            >
              คุณมีแต้มพอสำหรับแลกน้ำชา!
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                type="button"
                fullWidth
                variant="contained"
                onClick={() => setOpenRedeemDialog(true)}
                sx={{ 
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  backgroundColor: '#34c759',
                  '&:hover': {
                    backgroundColor: '#248a3d',
                  },
                }}
              >
                แลกน้ำชา (10 แต้ม)
              </Button>
              <Button
                type="button"
                fullWidth
                variant="text"
                onClick={() => setOpenClearDialog(true)}
                sx={{ 
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: '#ff3b30',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 59, 48, 0.04)',
                  },
                }}
              >
                ล้างข้อมูล
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Notification Dialog */}
      <Dialog
        open={openSnackbar}
        onClose={handleCloseSnackbar}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }
        }}
      >
        <Box sx={{
          width: '100%',
          maxWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          p: 3,
        }}>
          <Typography
            variant="h5"
            sx={{ 
              fontFamily: 'Kanit',
              fontWeight: 600,
              color: '#1d1d1f',
              textAlign: 'center',
              fontSize: '1.5rem',
            }}
          >
            {message}
          </Typography>
          <Button 
            onClick={handleCloseSnackbar}
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              fontFamily: 'Kanit',
              backgroundColor: '#1d1d1f',
              height: '44px',
              width: '140px',
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: '#2d2d2f',
              },
            }}
          >
            ปิด
          </Button>
        </Box>
      </Dialog>

      <Dialog 
        open={openRedeemDialog} 
        onClose={() => setOpenRedeemDialog(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            m: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontFamily: 'Kanit',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1d1d1f',
          pt: 3,
        }}>
          ยืนยันการแลกแต้ม
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ 
            textAlign: 'center', 
            fontFamily: 'Kanit',
            color: '#86868b',
            mt: 1,
          }}>
            คุณต้องการแลกแต้ม 10 แต้มเพื่อรับน้ำชา 1 แก้ว ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 3 }}>
          <Button 
            onClick={() => setOpenRedeemDialog(false)}
            variant="outlined"
            fullWidth
            sx={{ 
              borderRadius: '8px',
              fontFamily: 'Kanit',
              borderColor: '#1d1d1f',
              color: '#1d1d1f',
              height: '44px',
            }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleRedeem}
            variant="contained"
            fullWidth
            sx={{ 
              borderRadius: '8px',
              fontFamily: 'Kanit',
              backgroundColor: '#34c759',
              height: '44px',
              '&:hover': {
                backgroundColor: '#248a3d',
              },
            }}
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openClearDialog} 
        onClose={() => setOpenClearDialog(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            m: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontFamily: 'Kanit',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1d1d1f',
          pt: 3,
        }}>
          ยืนยันการล้างข้อมูล
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ 
            textAlign: 'center', 
            fontFamily: 'Kanit',
            color: '#86868b',
            mt: 1,
          }}>
            คุณต้องการล้างข้อมูลในฟอร์ม ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 3 }}>
          <Button 
            onClick={() => setOpenClearDialog(false)}
            variant="outlined"
            fullWidth
            sx={{ 
              borderRadius: '8px',
              fontFamily: 'Kanit',
              borderColor: '#1d1d1f',
              color: '#1d1d1f',
              height: '44px',
            }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleClear}
            variant="contained"
            fullWidth
            sx={{ 
              borderRadius: '8px',
              fontFamily: 'Kanit',
              backgroundColor: '#ff3b30',
              height: '44px',
              '&:hover': {
                backgroundColor: '#d70015',
              },
            }}
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openPointsDialog} 
        onClose={() => setOpenPointsDialog(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            m: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontFamily: 'Kanit',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1d1d1f',
          pt: 3,
        }}>
          ข้อมูลแต้มสะสม
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {isLoading ? (
              <CircularProgress size={40} sx={{ color: '#1d1d1f' }} />
            ) : (
              <>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1d1d1f',
                    mb: 2,
                    fontFamily: 'Kanit',
                  }}
                >
                  {currentPoints} แต้ม
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#86868b',
                    fontFamily: 'Kanit',
                    fontSize: '1rem',
                  }}
                >
                  เบอร์ {phoneNumber}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
          <Button 
            onClick={() => setOpenPointsDialog(false)}
            variant="contained"
            fullWidth
            sx={{ 
              borderRadius: '8px',
              fontFamily: 'Kanit',
              backgroundColor: '#1d1d1f',
              height: '44px',
              '&:hover': {
                backgroundColor: '#2d2d2f',
              },
            }}
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog 
        open={openHistoryDialog} 
        onClose={() => setOpenHistoryDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            m: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontFamily: 'Kanit',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1d1d1f',
          pt: 3,
        }}>
          ประวัติการแลกแต้มทั้งหมด
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={40} sx={{ color: '#1d1d1f' }} />
            </Box>
          ) : history.length > 0 ? (
            <List>
              {history.map((item, index) => (
                <Box key={item.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontFamily: 'Kanit', fontWeight: 500 }}>
                            เบอร์ {item.phone_number}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Kanit', fontWeight: 500 }}>
                            แลกน้ำชา 1 แก้ว (-10 แต้ม)
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ 
                          textAlign: 'right',
                          fontFamily: 'Kanit',
                          color: '#86868b',
                          fontSize: '0.875rem'
                        }}>
                          {new Date(item.created_at).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < history.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          ) : (
            <Typography 
              sx={{ 
                textAlign: 'center', 
                py: 3,
                color: '#86868b',
                fontFamily: 'Kanit'
              }}
            >
              ยังไม่มีประวัติการแลกแต้ม
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
          <Button 
            onClick={() => setOpenHistoryDialog(false)}
            variant="contained"
            fullWidth
            sx={{ 
              borderRadius: '8px',
              fontFamily: 'Kanit',
              backgroundColor: '#1d1d1f',
              height: '44px',
              '&:hover': {
                backgroundColor: '#2d2d2f',
              },
            }}
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhoneInput; 