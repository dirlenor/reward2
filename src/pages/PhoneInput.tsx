import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container,
  Paper,
  Alert,
  Snackbar,
  useTheme,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { supabase, PointRecord } from '../lib/supabase';

const PhoneInput = () => {
  const theme = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number | null>(null);
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [openPointsDialog, setOpenPointsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      
      setCurrentPoints(currentPoints - 10);
      setMessage('แลกแต้มสำเร็จ! คุณได้รับน้ำชา 1 แก้ว');
      setSeverity('success');
      setOpenRedeemDialog(false);
    } catch (error) {
      console.error('Error:', error);
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setSeverity('error');
    } finally {
      setOpenSnackbar(true);
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
      setSeverity('error');
      setOpenSnackbar(true);
      setCurrentPoints(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
            points: existingRecord.points + 1,
            updated_at: new Date().toISOString()
          })
          .eq('phone_number', phoneNumber);

        if (updateError) throw updateError;
        setMessage(`อัพเดทแต้มสำเร็จ! ตอนนี้คุณมี ${existingRecord.points + 1} แต้ม`);
        setCurrentPoints(existingRecord.points + 1);
      } else {
        const { error: insertError } = await supabase
          .from('points')
          .insert([{ 
            phone_number: phoneNumber,
            points: 1
          }]);

        if (insertError) throw insertError;
        setMessage('เพิ่มแต้มสำเร็จ! คุณได้รับ 1 แต้ม');
        setCurrentPoints(1);
      }

      setSeverity('success');
      setPhoneNumber('');
    } catch (error) {
      console.error('Error:', error);
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setSeverity('error');
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
    setSeverity('success');
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography 
            variant="h6" 
            component="h2" 
            align="center"
            sx={{
              fontWeight: 500,
              color: theme.palette.primary.main,
              mb: 1,
              fontSize: '1.2rem',
            }}
          >
            สะสมแต้ม
          </Typography>
          <Box
            sx={{
              textAlign: 'center',
              mb: 2,
              animation: 'float 3s ease-in-out infinite',
              '@keyframes float': {
                '0%': {
                  transform: 'translateY(0px)',
                },
                '50%': {
                  transform: 'translateY(-10px)',
                },
                '100%': {
                  transform: 'translateY(0px)',
                },
              },
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#000',
                fontFamily: 'Kanit',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                letterSpacing: '1px',
              }}
            >
              Moma's Tea Point
            </Typography>
          </Box>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              fullWidth
              label="เบอร์มือถือ"
              variant="outlined"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              margin="normal"
              required
              inputProps={{ 
                pattern: "[0-9]*",
                inputMode: "numeric",
                maxLength: 10
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '56px',
                },
                '& .MuiInputLabel-root': {
                  fontFamily: 'Kanit',
                },
              }}
            />
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                type="button"
                fullWidth
                variant="outlined"
                color="primary"
                onClick={checkPoints}
                sx={{ 
                  height: '48px',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                }}
              >
                เช็คยอดแต้ม
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ 
                  height: '48px',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                }}
              >
                สะสมแต้ม
              </Button>
            </Stack>
            {currentPoints !== null && currentPoints >= 10 && (
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={() => setOpenRedeemDialog(true)}
                  sx={{ 
                    height: '48px',
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
                    },
                  }}
                >
                  แลกน้ำชา (10 แต้ม)
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={() => setOpenClearDialog(true)}
                  sx={{ 
                    height: '48px',
                    fontSize: '1.1rem',
                    fontWeight: 500,
                  }}
                >
                  ล้างข้อมูล
                </Button>
              </Stack>
            )}
          </form>
        </Paper>
      </Container>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={severity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            fontFamily: 'Kanit',
          }}
        >
          {message}
        </Alert>
      </Snackbar>

      <Dialog 
        open={openRedeemDialog} 
        onClose={() => setOpenRedeemDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '16px',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Kanit' }}>
          ยืนยันการแลกแต้ม
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ textAlign: 'center', fontFamily: 'Kanit' }}>
            คุณต้องการแลกแต้ม 10 แต้มเพื่อรับน้ำชา 1 แก้ว ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setOpenRedeemDialog(false)}
            variant="outlined"
            sx={{ 
              borderRadius: '25px',
              fontFamily: 'Kanit',
            }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleRedeem}
            variant="contained"
            sx={{ 
              borderRadius: '25px',
              fontFamily: 'Kanit',
              background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
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
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '16px',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Kanit' }}>
          ยืนยันการล้างข้อมูล
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ textAlign: 'center', fontFamily: 'Kanit' }}>
            คุณต้องการล้างข้อมูลในฟอร์ม ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setOpenClearDialog(false)}
            variant="outlined"
            sx={{ 
              borderRadius: '25px',
              fontFamily: 'Kanit',
            }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleClear}
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: '25px',
              fontFamily: 'Kanit',
            }}
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openPointsDialog} 
        onClose={() => setOpenPointsDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '16px',
            minWidth: '300px',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Kanit' }}>
          ข้อมูลแต้มสะสม
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 1,
                    fontFamily: 'Kanit',
                  }}
                >
                  {currentPoints} แต้ม
                </Typography>
                <Typography 
                  sx={{ 
                    color: 'text.secondary',
                    fontFamily: 'Kanit',
                  }}
                >
                  เบอร์ {phoneNumber}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setOpenPointsDialog(false)}
            variant="contained"
            sx={{ 
              borderRadius: '25px',
              fontFamily: 'Kanit',
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
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